import { Navigate, useParams } from 'react-router-dom';

// Redirect from legacy /app/reading/:id to /app/lecture/:id
export default function ReadingRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/app/lecture/${id}`} replace />;
}
