import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { EmptyState } from '../components/common/StateViews';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const NotFoundPage = () => {
  useDocumentTitle('Page not found');
  const navigate = useNavigate();

  return (
    <div className="grid min-h-screen place-items-center">
      <EmptyState
        icon={Compass}
        title="This page does not exist"
        message="The link may be broken or the page was moved."
        action={<Button onClick={() => navigate('/')}>Go to the library</Button>}
      />
    </div>
  );
};

export default NotFoundPage;
