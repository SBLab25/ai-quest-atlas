import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { Event } from '@/hooks/useGamification';
import { motion } from 'framer-motion';

interface EventBannerProps {
  event: Event;
}

export const EventBanner = ({ event }: EventBannerProps) => {
  const timeRemaining = new Date(event.end_date).getTime() - Date.now();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-background border-primary/30">
        {event.banner_url && (
          <div 
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${event.banner_url})` }}
          />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  🎉 {event.theme}
                </Badge>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {daysRemaining}d {hoursRemaining}h left
                </Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2">{event.name}</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
            {event.reward_type && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Event Reward</p>
                <p className="text-lg font-bold text-primary">
                  {event.reward_value} {event.reward_type}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
