import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Upload, 
  FileArchive, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ImageIcon,
  Database
} from 'lucide-react';
import { parseCbdFilename, getStoragePath, generateAllCbdMappings, type CardMapping } from '@/utils/cbdDeckMapping';

interface ImportResult {
  filename: string;
  cardId: string | null;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

interface ImportStats {
  total: number;
  uploaded: number;
  updated: number;
  errors: number;
  skipped: number;
}

export default function AdminImportDeck() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processZipFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setStats(null);
    setError(null);
    
    try {
      // Load ZIP
      setCurrentFile('Lecture du fichier ZIP...');
      const zip = await JSZip.loadAsync(file);
      
      // Get all jpg files
      const jpgFiles: { name: string; file: JSZip.JSZipObject }[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && /\.(jpg|jpeg)$/i.test(relativePath)) {
          // Get just the filename, not the full path
          const filename = relativePath.split('/').pop() || relativePath;
          jpgFiles.push({ name: filename, file: zipEntry });
        }
      });
      
      if (jpgFiles.length === 0) {
        throw new Error('Aucun fichier JPG trouvé dans le ZIP');
      }
      
      // Generate expected mappings for validation
      const expectedMappings = generateAllCbdMappings();
      const expectedFilenames = new Set(expectedMappings.map(m => m.cbdFilename.toLowerCase()));
      
      const importResults: ImportResult[] = [];
      const localStats: ImportStats = {
        total: jpgFiles.length,
        uploaded: 0,
        updated: 0,
        errors: 0,
        skipped: 0,
      };
      
      // Process each file
      for (let i = 0; i < jpgFiles.length; i++) {
        const { name, file: zipEntry } = jpgFiles[i];
        const progressPercent = Math.round(((i + 1) / jpgFiles.length) * 100);
        setProgress(progressPercent);
        setCurrentFile(name);
        
        // Parse filename to get card mapping
        const mapping = parseCbdFilename(name);
        
        if (!mapping) {
          // Not a recognized card file (e.g., z01.jpg)
          importResults.push({
            filename: name,
            cardId: null,
            status: 'skipped',
            message: 'Fichier non reconnu comme carte de tarot',
          });
          localStats.skipped++;
          continue;
        }
        
        try {
          // Extract file content
          const content = await zipEntry.async('arraybuffer');
          const blob = new Blob([content], { type: 'image/jpeg' });
          
          // Upload to storage
          const storagePath = getStoragePath(name);
          const { error: uploadError } = await supabase.storage
            .from('tarot-cards')
            .upload(storagePath, blob, {
              contentType: 'image/jpeg',
              upsert: true, // Overwrite if exists (idempotent)
            });
          
          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('tarot-cards')
            .getPublicUrl(storagePath);
          
          const publicUrl = urlData.publicUrl;
          
          // Update database - try to update existing card
          const { error: updateError, count } = await supabase
            .from('tarot_cards')
            .update({ image_url: publicUrl })
            .eq('id', mapping.cardId)
            .select();
          
          if (updateError) {
            throw new Error(`DB update failed: ${updateError.message}`);
          }
          
          // If card doesn't exist, insert it (only for minor arcana that might be missing)
          if (!count || count === 0) {
            const { error: insertError } = await supabase
              .from('tarot_cards')
              .upsert({
                id: mapping.cardId,
                type: mapping.type,
                numero: mapping.numero,
                nom_fr: mapping.nomFr,
                image_url: publicUrl,
              }, {
                onConflict: 'id',
                ignoreDuplicates: false,
              });
            
            if (insertError) {
              throw new Error(`DB insert failed: ${insertError.message}`);
            }
          }
          
          importResults.push({
            filename: name,
            cardId: mapping.cardId,
            status: 'success',
            message: `Uploadé et lié à ${mapping.cardId}`,
          });
          localStats.uploaded++;
          localStats.updated++;
          
        } catch (fileError) {
          const errorMessage = fileError instanceof Error ? fileError.message : 'Erreur inconnue';
          importResults.push({
            filename: name,
            cardId: mapping.cardId,
            status: 'error',
            message: errorMessage,
          });
          localStats.errors++;
        }
      }
      
      // Check for missing expected files
      const processedFilenames = new Set(jpgFiles.map(f => f.name.toLowerCase()));
      for (const expected of expectedFilenames) {
        if (!processedFilenames.has(expected)) {
          importResults.push({
            filename: expected,
            cardId: null,
            status: 'error',
            message: 'Fichier attendu mais absent du ZIP',
          });
        }
      }
      
      setResults(importResults);
      setStats(localStats);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setCurrentFile('');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.zip')) {
      processZipFile(files[0]);
    } else {
      setError('Veuillez déposer un fichier ZIP');
    }
  }, [processZipFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processZipFile(files[0]);
    }
  }, [processZipFile]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const successResults = results.filter(r => r.status === 'success');
  const errorResults = results.filter(r => r.status === 'error');
  const skippedResults = results.filter(r => r.status === 'skipped');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-serif text-2xl font-semibold">Import Deck CBD</h1>
              <p className="text-muted-foreground">
                Importez le deck Tarot CBD (Yoav Ben-Dov) depuis un fichier ZIP
              </p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="h-5 w-5" />
                Format attendu
              </CardTitle>
              <CardDescription>
                Le ZIP doit contenir les fichiers JPG du deck CBD avec le naming standard
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Arcanes Majeurs :</strong> a01.jpg à a22.jpg (a22 = Le Mat)</p>
              <p><strong>Bâtons :</strong> b01.jpg à b14.jpg</p>
              <p><strong>Coupes :</strong> c01.jpg à c14.jpg</p>
              <p><strong>Deniers :</strong> d01.jpg à d14.jpg</p>
              <p><strong>Épées :</strong> e01.jpg à e14.jpg</p>
              <p className="text-xs italic mt-4">Total attendu : 78 cartes</p>
            </CardContent>
          </Card>

          {/* Upload Zone */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                    <div className="space-y-2">
                      <p className="font-medium">Importation en cours...</p>
                      <p className="text-sm text-muted-foreground">{currentFile}</p>
                      <Progress value={progress} className="max-w-xs mx-auto" />
                      <p className="text-xs text-muted-foreground">{progress}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Glissez-déposez votre fichier ZIP ici</p>
                      <p className="text-sm text-muted-foreground">ou</p>
                    </div>
                    <Button onClick={handleButtonClick}>
                      <FileArchive className="h-4 w-4 mr-2" />
                      Sélectionner un fichier ZIP
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {stats && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Résultat de l'import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Fichiers traités</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-500/10">
                      <p className="text-2xl font-bold text-green-600">{stats.uploaded}</p>
                      <p className="text-sm text-muted-foreground">Uploadés</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-500/10">
                      <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                      <p className="text-sm text-muted-foreground">Erreurs</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                      <p className="text-2xl font-bold text-yellow-600">{stats.skipped}</p>
                      <p className="text-sm text-muted-foreground">Ignorés</p>
                    </div>
                  </div>
                  
                  {stats.errors === 0 && stats.uploaded === 78 && (
                    <Alert className="mt-4 bg-green-500/10 border-green-500/30">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-700">Import réussi !</AlertTitle>
                      <AlertDescription className="text-green-600">
                        Les 78 cartes ont été importées et liées à la base de données.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Détails ({results.length} fichiers)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {/* Errors first */}
                      {errorResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            Erreurs ({errorResults.length})
                          </h4>
                          {errorResults.map((r, i) => (
                            <div key={`error-${i}`} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-red-500/5">
                              <Badge variant="destructive" className="text-xs">Erreur</Badge>
                              <span className="font-mono">{r.filename}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-red-600">{r.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Skipped */}
                      {skippedResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Ignorés ({skippedResults.length})
                          </h4>
                          {skippedResults.map((r, i) => (
                            <div key={`skip-${i}`} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-yellow-500/5">
                              <Badge variant="secondary" className="text-xs">Ignoré</Badge>
                              <span className="font-mono">{r.filename}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-yellow-600">{r.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Success */}
                      {successResults.length > 0 && (
                        <div>
                          <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Réussis ({successResults.length})
                          </h4>
                          {successResults.map((r, i) => (
                            <div key={`success-${i}`} className="flex items-center gap-2 text-sm py-1 px-2 rounded bg-green-500/5">
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">OK</Badge>
                              <span className="font-mono">{r.filename}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-green-600">{r.cardId}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
