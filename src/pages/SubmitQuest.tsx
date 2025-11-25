import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Camera, MapPin, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { verifyPhotoProof } from "@/services/aiEnhancements";

interface Quest {
  id: string;
  title: string;
  description: string;
  location?: string;
}

const SubmitQuest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getActivePowerUps } = useGamification();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isAIQuest, setIsAIQuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [geoLocation, setGeoLocation] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchQuest = async () => {
      if (!id) return;

      try {
        // First try to fetch from regular Quests table
        let questData = null;
        let error = null;
        let foundInAI = false;
        
        const { data: regularQuestData, error: regularQuestError } = await supabase
          .from("Quests")
          .select("id, title, description")
          .eq("id", id)
          .maybeSingle();

        if (regularQuestData) {
          questData = regularQuestData;
        } else {
          // If not found in regular quests, try AI-generated quests tables
          // Check both ai_generated_quests and suggested_quests
          const [aiGeneratedResult, suggestedResult] = await Promise.all([
            supabase
              .from("ai_generated_quests")
              .select("id, title, description")
              .eq("id", id)
              .maybeSingle(),
            supabase
              .from("suggested_quests")
              .select("id, title, description")
              .eq("id", id)
              .maybeSingle()
          ]);

          if (aiGeneratedResult.data) {
            questData = aiGeneratedResult.data;
            foundInAI = true;
          } else if (suggestedResult.data) {
            questData = suggestedResult.data;
            foundInAI = true;
          } else {
            error = aiGeneratedResult.error || suggestedResult.error || regularQuestError;
          }
        }

        if (!questData) {
          throw error || new Error("Quest not found");
        }
        
        setQuest(questData);
        setIsAIQuest(foundInAI);

        // Check if user has already submitted (only for regular quests)
        // Exclude rejected submissions - they should allow resubmission
        if (!foundInAI) {
          const { data: existingSubmission } = await supabase
            .from("Submissions")
            .select("id, status")
            .eq("quest_id", id)
            .eq("user_id", user.id)
            .neq("status", "rejected") // Ignore rejected submissions
            .maybeSingle();

          if (existingSubmission) {
            toast({
              title: "Already Submitted",
              description: "You have already submitted for this quest.",
              variant: "destructive",
            });
            navigate(`/quest/${id}`);
          }
        }
      } catch (error) {
        console.error("Error fetching quest:", error);
        toast({
          title: "Error",
          description: "Failed to load quest details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuest();
  }, [id, user, navigate, toast]);

  const validateFile = (file: File): string | null => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      return "Please select an image (JPEG, PNG, GIF, WebP), video (MP4, MOV, WebM), or PDF file";
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file.name);
      const error = validateFile(file);
      if (error) {
        setFileError(error);
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }

      setFileError(null);
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGeoLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          
          // Warn if accuracy is poor (likely IP-based)
          if (accuracy && accuracy > 3000) {
            toast({
              title: "Low Accuracy Warning",
              description: `Location accuracy is ±${Math.round(accuracy)}m. This may be inaccurate (off by 200-400km). Please verify the coordinates or enter manually.`,
              variant: "destructive",
              duration: 8000
            });
          } else {
            toast({
              title: "Location Added",
              description: `Your current location has been added (accuracy: ±${Math.round(accuracy || 0)}m).`,
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          let message = "Could not get your location. You can enter it manually.";
          if (error.code === 2) {
            message = "GPS unavailable. This often happens on desktop or with VPN. Please enter your location manually.";
          }
          toast({
            title: "Location Error",
            description: message,
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !quest || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      let photoUrl = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('quest-submissions')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('quest-submissions')
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Create submission
      // For AI quests, we need to track the quest ID separately since quest_id has FK constraint
      // We'll store it in a separate tracking table after creating the submission
      const submissionDescription = isAIQuest 
        ? description.trim() 
        : description.trim();
      
      const payload: any = {
        user_id: user.id,
        description: submissionDescription,
        photo_url: photoUrl,
        geo_location: geoLocation.trim() || null,
        status: 'pending',
        quest_id: isAIQuest ? null : quest.id, // AI quests can't use quest_id due to FK constraint
      };

      const { data: submission, error: submitError } = await supabase
        .from("Submissions")
        .insert(payload)
        .select()
        .single();

      if (submitError) throw submitError;

      // For AI quests, create a tracking record to link submission to quest
      if (isAIQuest && submission && quest.id) {
        try {
          // Check if ai_quest_submissions table exists, if not we'll use description workaround
          // Store AI quest ID in description as metadata (format: [AI_QUEST_ID:quest_id])
          // This allows us to extract it later for completion tracking
          const updatedDescription = `${submissionDescription}\n[AI_QUEST_ID:${quest.id}]`;
          await supabase
            .from("Submissions")
            .update({ description: updatedDescription })
            .eq("id", submission.id);
        } catch (trackingError) {
          // If tracking fails, log but don't block submission
          console.warn('Failed to track AI quest ID:', trackingError);
        }
      }

      // Check for active instant_verify powerup
      const activePowerUps = getActivePowerUps();
      const instantVerifyPowerup = activePowerUps.find(
        up => up.powerups?.effect_type === 'instant_verify'
      );

      // Trigger automatic AI verification (deepfake detection + Groq analysis) if photo was uploaded
      if (photoUrl && submission) {
        // If instant verify powerup is active, skip AI verification and auto-approve
        if (instantVerifyPowerup) {
          console.log('⚡ Instant Verify powerup active - skipping AI verification');
          
          // Auto-approve the submission
          const { error: approveError } = await supabase
            .from('Submissions')
            .update({ 
              status: 'approved'
            })
            .eq('id', submission.id);

          if (approveError) {
            console.error('Error auto-approving submission:', approveError);
          } else {
            // Deactivate the instant_verify powerup (single-use, duration_hours = 0)
            if (instantVerifyPowerup.id) {
              await supabase
                .from('user_powerups')
                .update({ 
                  is_active: false,
                  expires_at: new Date().toISOString() // Mark as expired/used
                })
                .eq('id', instantVerifyPowerup.id);
            }

            toast({
              title: "⚡ Instant Verified!",
              description: "Your Instant Verify powerup was used! Submission automatically approved.",
            });
          }
        } else {
          // Automatic AI verification flow (deepfake detection + Groq analysis)
          console.log('🤖 Starting automatic AI verification...', {
            submissionId: submission.id,
            questTitle: quest.title,
          });

          // Create ai_verification record first
          const { data: verification, error: verificationError } = await supabase
            .from('ai_verifications' as any)
            .insert({
              user_id: user.id,
              quest_id: isAIQuest ? null : quest.id,
              submission_id: submission.id,
              photo_url: photoUrl,
              verdict: 'uncertain', // Will be updated based on deepfake result
              reason: 'Automatic verification in progress',
              model_used: 'deepfake-detection + groq-analysis',
            })
            .select()
            .single();

          if (verificationError) {
            console.error('❌ Error creating verification record:', verificationError);
            toast({
              title: "✅ Submission Received",
              description: "Your submission has been received and is being processed.",
            });
          } else {
            const verificationRecord = verification as any;
            console.log('✅ Verification record created:', verificationRecord.id);

            // Trigger deepfake detection and Groq analysis in parallel
            const triggerVerification = async () => {
              try {
                // Call both Edge Functions in parallel
                const [deepfakeResult, groqResult] = await Promise.allSettled([
                  supabase.functions.invoke('deepfake-detection', {
                    body: {
                      verificationId: verificationRecord.id,
                      photoUrl: photoUrl,
                    },
                  }),
                  supabase.functions.invoke('groq-analysis', {
                    body: {
                      verificationId: verificationRecord.id,
                      photoUrl: photoUrl,
                    },
                  }),
                ]);

                // Process deepfake detection result
                let deepfakeVerdict: 'REAL' | 'FAKE' | null = null;
                
                if (deepfakeResult.status === 'fulfilled') {
                  const response = deepfakeResult.value;
                  console.log('🔍 Deepfake detection response:', response);
                  
                  // Check response structure - data might be nested
                  const result = response.data || response;
                  
                  if (result && result.deepfakeResult) {
                    deepfakeVerdict = result.deepfakeResult.isDeepfake ? 'FAKE' : 'REAL';
                    console.log('🔍 Deepfake detection result from response:', deepfakeVerdict);
                  } else if (result && result.success) {
                    // Alternative structure check
                    if (result.deepfakeResult) {
                      deepfakeVerdict = result.deepfakeResult.isDeepfake ? 'FAKE' : 'REAL';
                      console.log('🔍 Deepfake detection result (alt structure):', deepfakeVerdict);
                    }
                  }
                } else {
                  console.error('❌ Deepfake detection failed:', deepfakeResult);
                }

                // If we couldn't get verdict from response, wait a bit and query the database
                // (Edge Function updates DB asynchronously)
                if (!deepfakeVerdict) {
                  console.log('📊 Waiting for database update, then querying for deepfake verdict...');
                  // Wait 2 seconds for the Edge Function to update the database
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // Try querying the database with retries
                  let retries = 3;
                  while (retries > 0 && !deepfakeVerdict) {
                    const verificationRecord = verification as any;
                    const { data: verificationData, error: fetchError } = await supabase
                      .from('ai_verifications')
                      .select('deepfake_verdict')
                      .eq('id', verificationRecord.id)
                      .single();

                    const result = verificationData as { deepfake_verdict?: string } | null;
                    if (!fetchError && result && result.deepfake_verdict) {
                      deepfakeVerdict = result.deepfake_verdict as 'REAL' | 'FAKE';
                      console.log('🔍 Deepfake verdict from database:', deepfakeVerdict);
                      break;
                    } else {
                      console.log(`⏳ Verdict not ready yet, retries left: ${retries - 1}`);
                      retries--;
                      if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      }
                    }
                  }
                  
                  if (!deepfakeVerdict) {
                    console.error('❌ Could not fetch deepfake verdict from database after retries');
                  }
                }

                // Process Groq analysis result (log but don't block)
                if (groqResult.status === 'fulfilled') {
                  console.log('✅ Groq analysis completed');
                } else {
                  console.error('❌ Groq analysis failed:', groqResult);
                }

                // Update submission status based on deepfake result
                if (deepfakeVerdict) {
                  if (deepfakeVerdict === 'REAL') {
                    // Auto-approve if real
                    const { error: updateError } = await supabase
                      .from('Submissions')
                      .update({ 
                        status: 'approved'
                      })
                      .eq('id', submission.id);

                    if (updateError) {
                      console.error('❌ Error auto-approving submission:', updateError);
                      toast({
                        title: "Verification Error",
                        description: "Submission verification completed but approval failed. Please contact support.",
                        variant: "destructive",
                      });
                    } else {
                      console.log('✅ Submission auto-approved (Real image detected)');
                      toast({
                        title: "✅ Auto-Approved!",
                        description: "Your submission passed deepfake detection and was automatically approved.",
                      });
                    }
                  } else {
                    // Keep as pending for manual review if fake
                    console.log('⚠️ Submission requires manual review (Fake image detected)');
                    toast({
                      title: "✅ Submission Received",
                      description: "Your submission has been received and is being processed.",
                    });
                  }
                } else {
                  // If deepfake detection failed, keep as pending
                  console.log('⚠️ Deepfake detection failed, keeping submission as pending');
                  toast({
                    title: "Verification Notice",
                    description: "AI verification is being processed. Your submission is pending review.",
                  });
                }
              } catch (error: any) {
                console.error('❌ Error in automatic verification:', error);
                toast({
                  title: "Verification Notice",
                  description: "AI verification is being processed in the background.",
                });
              }
            };

            // Run verification in background (don't await)
            triggerVerification();
          }
        }
      } else if (instantVerifyPowerup && submission) {
        // Even without photo, instant verify can auto-approve
        const { error: approveError } = await supabase
          .from('Submissions')
          .update({ 
            status: 'approved'
          })
          .eq('id', submission.id);

        if (!approveError && instantVerifyPowerup.id) {
          // Deactivate the powerup
          await supabase
            .from('user_powerups')
            .update({ 
              is_active: false,
              expires_at: new Date().toISOString()
            })
            .eq('id', instantVerifyPowerup.id);

          toast({
            title: "⚡ Instant Verified!",
            description: "Your Instant Verify powerup was used! Submission automatically approved.",
          });
        }
      }

      // Auto-complete for all user's teams if this is a regular quest (not AI)
      if (!isAIQuest && quest.id) {
        try {
          // Get user's teams
          const { data: userTeams } = await (supabase as any)
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id);

          if (userTeams && userTeams.length > 0) {
            // Create team completions for each team (ignore duplicates)
            const teamCompletions = userTeams.map((tm: any) => ({
              team_id: tm.team_id,
              quest_id: quest.id,
              completed_by: user.id
            }));

            // Insert team completions (use upsert to handle duplicates)
            await (supabase as any)
              .from('team_quest_completions')
              .upsert(teamCompletions, { onConflict: 'team_id,quest_id' });

            console.log(`Quest marked complete for ${userTeams.length} teams`);
          }
        } catch (teamError) {
          // Don't fail the submission if team updates fail
          console.error('Error updating team completions:', teamError);
        }
      }

      toast({
        title: "Quest Submitted!",
        description: "Your submission has been received and is being processed.",
      });

      navigate(isAIQuest ? '/home' : `/quest/${quest.id}`);
    } catch (error) {
      console.error("Error submitting quest:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your quest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quest Not Found</h2>
          <p className="text-muted-foreground mb-4">The quest you're trying to submit for doesn't exist.</p>
          <Button onClick={() => navigate("/home")}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => (isAIQuest ? navigate('/home') : navigate(`/quest/${id}`))}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quest
          </Button>
        </div>

        {/* Quest Context */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              Submitting for: {quest.title}
            </CardTitle>
            <CardDescription>
              {quest.description}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Submit Your Quest
            </CardTitle>
            <CardDescription>
              Share your experience and proof of completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <Label htmlFor="photo">Photo/Video/PDF Evidence</Label>
                <div className="mt-2">
                  {!selectedFile ? (
                    <label
                      className="relative block rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ease-in-out cursor-pointer select-none border-border bg-background hover:border-primary hover:bg-accent/20"
                    >
                      <input
                        id="photo"
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileSelect}
                        capture={isMobile ? "environment" : undefined}
                        disabled={submitting}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Tap to Upload</p>
                          <p className="text-xs text-muted-foreground">Images, videos or PDF (MAX. 10MB)</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="relative border-2 border-green-500/20 bg-green-500/5 rounded-lg p-4">
                      <div className="relative w-full h-64">
                        {selectedFile.type.startsWith('image/') ? (
                          <img
                            src={previewUrl!}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : selectedFile.type === 'application/pdf' ? (
                          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                            PDF selected: {selectedFile.name}
                          </div>
                        ) : (
                          <video
                            src={previewUrl!}
                            className="w-full h-full object-cover rounded-lg"
                            controls
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    </div>
                  )}
                  
                  {fileError && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {fileError}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience, what you discovered, and how you completed the quest..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[100px]"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="location"
                    placeholder="Enter location or coordinates"
                    value={geoLocation}
                    onChange={(e) => setGeoLocation(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || !description.trim()}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Quest"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitQuest;