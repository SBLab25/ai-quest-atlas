import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleButton from './theme-toggle-button';

interface HeaderWithThemeProps {
  title?: string;
  showBack?: boolean;
  backUrl?: string;
  className?: string;
}

const HeaderWithTheme: React.FC<HeaderWithThemeProps> = ({
  title,
  showBack = false,
  backUrl,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h1 className="text-xl font-semibold">{title}</h1>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggleButton 
          start="center"
        />
      </div>
    </header>
  );
};

export default HeaderWithTheme;
