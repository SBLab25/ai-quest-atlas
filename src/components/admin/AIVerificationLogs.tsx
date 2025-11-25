import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Brain, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Shield, Bot, Sparkles, RotateCcw, Image } from 'lucide-react';
import { AIPhotoVerificationService } from '@/services/aiPhotoVerification';

interface AIVerification {
  id: string;
  user_id: string;
  quest_id: string | null;
  submission_id: string;
  photo_url: string;
  quest_match_score: number;
  geolocation_match_score: number;
  authenticity_score: number;
  scene_relevance_score: number;
  final_confidence: number;
  verdict: 'verified' | 'uncertain' | 'rejected';
  reason: string;
  model_used: string;
  admin_override: boolean;
  admin_override_reason: string | null;
  verified_at: string;
  deepfake_verdict?: string | null;
  deepfake_confidence?: number | null;
  analysis_report?: string | null;
  analyzed_at?: string | null;
  profiles?: {
    username: string;
    full_name: string;
  };
}

interface AILog {
  id: string;
  user_id: string;
  submission_id: string;
  model_used: string;
  confidence_score: number;
  execution_time_ms: number;
  status: 'success' | 'error' | 'timeout';
  error_message: string | null;
  created_at: string;
}

export const AIVerificationLogs: React.FC = () => {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<AIVerification[]>([]);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<AIVerification | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [analyzingVerificationId, setAnalyzingVerificationId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('📊 Fetching AI verification data...');
      
      const [verificationsRes, logsRes] = await Promise.all([
        supabase
          .from('ai_verifications' as any)
          .select('*')
          .order('verified_at', { ascending: false })
          .limit(100),
        supabase
          .from('ai_logs' as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (verificationsRes.error) {
        console.error('❌ Verifications error:', verificationsRes.error);
        throw verificationsRes.error;
      }
      if (logsRes.error) {
        console.error('❌ Logs error:', logsRes.error);
        throw logsRes.error;
      }

      console.log(`✅ Found ${verificationsRes.data?.length || 0} verifications`);
      console.log(`✅ Found ${logsRes.data?.length || 0} logs`);

      // Fetch profiles separately for all user_ids
      const userIds = [...new Set(verificationsRes.data?.map((v: any) => v.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', userIds);

        // Map profiles to verifications
        const verificationsWithProfiles = (verificationsRes.data || []).map((v: any) => ({
          ...v,
          profiles: profilesData?.find((p) => p.id === v.user_id),
        }));
        
        setVerifications(verificationsWithProfiles as any);
      } else {
        setVerifications((verificationsRes.data as any) || []);
      }
      
      setLogs((logsRes.data as any) || []);
    } catch (error: any) {
      console.error('Error fetching verification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminOverride = async (
    verificationId: string,
    newVerdict: 'verified' | 'rejected'
  ) => {
    try {
      if (!overrideReason.trim()) {
        toast({
          title: 'Missing Reason',
          description: 'Please provide a reason for the override',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('ai_verifications' as any)
        .update({
          verdict: newVerdict,
          admin_override: true,
          admin_override_reason: overrideReason,
        } as any)
        .eq('id', verificationId);

      if (error) throw error;

      // Update submission status
      const verification = verifications.find((v) => v.id === verificationId);
      if (verification) {
        await supabase
          .from('Submissions')
          .update({ status: newVerdict === 'verified' ? 'approved' : 'rejected' })
          .eq('id', verification.submission_id);
      }

      toast({
        title: 'Override Applied',
        description: `Verification manually ${newVerdict}`,
      });

      setShowOverrideDialog(false);
      setOverrideReason('');
      setSelectedVerification(null);
      fetchData();
    } catch (error) {
      console.error('Error applying override:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply admin override',
        variant: 'destructive',
      });
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'uncertain':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const resetDeepfakeVerdict = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_verifications' as any)
        .update({
          deepfake_verdict: null,
          deepfake_confidence: null,
        } as any)
        .eq('id', verificationId);

      if (error) throw error;

      toast({
        title: 'Deepfake Verdict Reset',
        description: 'Deepfake verdict has been cleared. You can now run analysis again.',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error resetting deepfake verdict:', error);
      toast({
        title: 'Reset Failed',
        description: error?.message || 'Failed to reset deepfake verdict. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const resetAnalysis = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from('ai_verifications' as any)
        .update({
          analysis_report: null,
        } as any)
        .eq('id', verificationId);

      if (error) throw error;

      toast({
        title: 'Analysis Reset',
        description: 'Analysis report has been cleared. You can now run analysis again.',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Error resetting analysis:', error);
      toast({
        title: 'Reset Failed',
        description: error?.message || 'Failed to reset analysis. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const runDeepfakeAnalysis = async (verificationId: string, photoUrl: string) => {
    if (!photoUrl) {
      toast({
        title: 'Error',
        description: 'No photo available for analysis',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzingVerificationId(verificationId);
    try {
      toast({
        title: 'Deepfake Detection Started',
        description: 'Running deepfake detection...',
      });

      console.log('Calling deepfake-detection function with:', { verificationId, photoUrl: photoUrl?.substring(0, 50) + '...' });
      
      const { data, error } = await supabase.functions.invoke('deepfake-detection', {
        body: {
          verificationId,
          photoUrl,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error details:', error);
        // Provide more helpful error message
        if (error.message?.includes('Failed to send a request')) {
          throw new Error('Edge Function not found or not deployed. Please deploy the deepfake-detection function to Supabase.');
        }
        throw error;
      }

      if (data?.success) {
        toast({
          title: 'Deepfake Detection Complete',
          description: 'Deepfake detection completed successfully',
        });
        // Refresh verifications to show updated data
        await fetchData();
      } else {
        throw new Error(data?.error || 'Deepfake detection failed');
      }
    } catch (error: any) {
      console.error('Error running deepfake detection:', error);
      toast({
        title: 'Deepfake Detection Failed',
        description: error?.message || 'Failed to run deepfake detection. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAnalyzingVerificationId(null);
    }
  };

  const runGroqAnalysis = async (verificationId: string, photoUrl: string) => {
    if (!photoUrl) {
      toast({
        title: 'Error',
        description: 'No photo available for analysis',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzingVerificationId(verificationId);
    try {
      toast({
        title: 'Groq Analysis Started',
        description: 'Running image analysis...',
      });

      console.log('Calling groq-analysis function with:', { verificationId, photoUrl: photoUrl?.substring(0, 50) + '...' });
      
      const { data, error } = await supabase.functions.invoke('groq-analysis', {
        body: {
          verificationId,
          photoUrl,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error details:', error);
        // Provide more helpful error message
        if (error.message?.includes('Failed to send a request')) {
          throw new Error('Edge Function not found or not deployed. Please deploy the groq-analysis function to Supabase.');
        }
        throw error;
      }

      if (data?.success) {
        toast({
          title: 'Groq Analysis Complete',
          description: 'Image analysis completed successfully',
        });
        // Refresh verifications to show updated data
        await fetchData();
      } else {
        throw new Error(data?.error || 'Groq analysis failed');
      }
    } catch (error: any) {
      console.error('Error running Groq analysis:', error);
      toast({
        title: 'Groq Analysis Failed',
        description: error?.message || 'Failed to run Groq analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAnalyzingVerificationId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Verifications</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{verifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-500">
              {verifications.filter((v) => v.verdict === 'verified').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Uncertain</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-yellow-500">
              {verifications.filter((v) => v.verdict === 'uncertain').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-500">
              {verifications.filter((v) => v.verdict === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">AI Verification History</CardTitle>
              <CardDescription className="text-xs md:text-sm">Recent photo verification results</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Verdict</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Deepfake Verdict</TableHead>
                <TableHead>Analysis</TableHead>
                <TableHead>Submission</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell>
                    <div className="font-medium">
                      {verification.profiles?.username || 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {verification.profiles?.full_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getVerdictIcon(verification.verdict)}
                      <span className="capitalize">{verification.verdict}</span>
                      {verification.admin_override && (
                        <Badge variant="outline" className="ml-2">
                          <Shield className="h-3 w-3 mr-1" />
                          Override
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={AIPhotoVerificationService.getVerdictColor(
                        verification.verdict
                      )}
                    >
                      {Math.round(verification.final_confidence * 100)}%
                    </Badge>
                  </TableCell>
                   <TableCell>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {verification.deepfake_verdict ? (
                        <>
                          <Badge
                            variant={verification.deepfake_verdict === 'FAKE' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {verification.deepfake_verdict}
                            {verification.deepfake_confidence !== null && verification.deepfake_confidence !== undefined && (
                              <span className="ml-1">
                                ({Math.round(verification.deepfake_confidence * 100)}%)
                              </span>
                            )}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetDeepfakeVerdict(verification.id)}
                            title="Reset deepfake verdict"
                            className="h-8 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runDeepfakeAnalysis(verification.id, verification.photo_url)}
                          disabled={!verification.photo_url || analyzingVerificationId === verification.id}
                          className="text-xs"
                        >
                          <Bot className="h-3 w-3 mr-1" />
                          {analyzingVerificationId === verification.id ? 'Analyzing...' : 'Analyze'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                   <TableCell>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {verification.analysis_report ? (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                View Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-base md:text-lg">Image Analysis Report</DialogTitle>
                                <DialogDescription className="text-xs md:text-sm">
                                  Analysis performed on {verification.analyzed_at ? new Date(verification.analyzed_at).toLocaleString() : 'Unknown date'}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <div className="prose prose-sm max-w-none">
                                  <pre className="whitespace-pre-wrap text-xs md:text-sm bg-muted p-3 md:p-4 rounded-lg">
                                    {verification.analysis_report}
                                  </pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetAnalysis(verification.id)}
                            title="Reset analysis"
                            className="h-8 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runGroqAnalysis(verification.id, verification.photo_url)}
                          disabled={!verification.photo_url || analyzingVerificationId === verification.id}
                          className="text-xs"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {analyzingVerificationId === verification.id ? 'Generating...' : 'Generate'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                   <TableCell>
                    {verification.photo_url ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Image className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base md:text-lg">Submission Image</DialogTitle>
                            <DialogDescription className="text-xs md:text-sm">
                              Quest submission photo for verification
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 flex justify-center">
                            <img
                              src={verification.photo_url}
                              alt="Submission"
                              className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-xs text-muted-foreground">No image</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(verification.verified_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={showOverrideDialog && selectedVerification?.id === verification.id}
                      onOpenChange={(open) => {
                        setShowOverrideDialog(open);
                        if (!open) {
                          setSelectedVerification(null);
                          setOverrideReason('');
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVerification(verification);
                            setShowOverrideDialog(true);
                          }}
                        >
                          Override
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Admin Override</DialogTitle>
                          <DialogDescription>
                            Manually override the AI verification result
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Reason for Override</label>
                            <Textarea
                              placeholder="Explain why you're overriding the AI decision..."
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              onClick={() =>
                                handleAdminOverride(verification.id, 'verified')
                              }
                              className="flex-1"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleAdminOverride(verification.id, 'rejected')
                              }
                              className="flex-1"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
