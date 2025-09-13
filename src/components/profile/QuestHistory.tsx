import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Trophy, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface QuestSubmission {
  id: string;
  description: string | null;
  image_urls: string[] | null;
  photo_url: string | null;
  status: string | null;
  submitted_at: string | null;
  geo_location: string | null;
  quest: {
    id: string;
    title: string;
    description: string | null;
    difficulty: number | null;
    location: string | null;
    quest_type: string | null;
  } | null;
}

interface QuestHistoryProps {
  userId: string;
}

export const QuestHistory: React.FC<QuestHistoryProps> = ({ userId }) => {
  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    fetchQuestHistory();
  }, [userId]);

  const fetchQuestHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('Submissions')
        .select(`
          *,
          quest:Quests(*)
        `)
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching quest history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDifficultyStars = (difficulty: number | null) => {
    if (!difficulty) return null;
    return '★'.repeat(Math.min(difficulty, 5));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubmissionImage = (submission: QuestSubmission) => {
    if (submission.image_urls && submission.image_urls.length > 0) {
      return submission.image_urls[0];
    }
    return submission.photo_url;
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.status === filter;
  });

  const getStats = () => {
    const verified = submissions.filter(s => s.status === 'verified').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    return { verified, pending, rejected, total: submissions.length };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Quests</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.verified}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </Button>
        <Button
          variant={filter === 'verified' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('verified')}
        >
          Completed ({stats.verified})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={filter === 'rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('rejected')}
        >
          Rejected ({stats.rejected})
        </Button>
      </div>

      {/* Quest History List */}
      {filteredSubmissions.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No quest history</h3>
          <p className="text-muted-foreground">Start completing quests to see your history here!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Quest Image */}
                  {getSubmissionImage(submission) && (
                    <div className="flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer">
                            <AspectRatio ratio={1} className="w-20">
                              <img 
                                src={getSubmissionImage(submission)!} 
                                alt="Quest submission"
                                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                              />
                            </AspectRatio>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl" aria-describedby="quest-submission-description">
                          <DialogHeader>
                            <DialogTitle>{submission.quest?.title || 'Quest Submission'}</DialogTitle>
                          </DialogHeader>
                          <div id="quest-submission-description" className="sr-only">
                            Quest submission details and image
                          </div>
                          <AspectRatio ratio={16/9}>
                            <img 
                              src={getSubmissionImage(submission)!} 
                              alt="Quest submission"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </AspectRatio>
                          {submission.description && (
                            <p className="text-muted-foreground">{submission.description}</p>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Quest Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {submission.quest?.title || 'Unknown Quest'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(submission.submitted_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>

                    {submission.quest?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {submission.quest.description}
                      </p>
                    )}

                    {submission.description && (
                      <p className="text-sm text-foreground bg-muted/50 p-2 rounded italic">
                        "{submission.description}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {submission.quest?.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {submission.quest.location}
                        </div>
                      )}
                      {submission.quest?.difficulty && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {getDifficultyStars(submission.quest.difficulty)}
                        </div>
                      )}
                      {submission.quest?.quest_type && (
                        <Badge variant="outline" className="text-xs">
                          {submission.quest.quest_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};