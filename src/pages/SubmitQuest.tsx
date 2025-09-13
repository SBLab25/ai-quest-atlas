import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Camera, MapPin, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Quest {
  id: string;
  title: string;
  description: string;
}

const SubmitQuest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [quest, setQuest] = useState<Quest | null>(null);
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
        
        const { data: regularQuestData, error: regularQuestError } = await supabase
          .from("Quests")
          .select("id, title, description")
          .eq("id", id)
          .maybeSingle();

        if (regularQuestData) {
          questData = regularQuestData;
        } else {
          // If not found in regular quests, try AI-generated quests
          const { data: aiQuestData, error: aiQuestError } = await supabase
            .from("ai_generated_quests")
            .select("id, title, description")
            .eq("id", id)
            .maybeSingle();

          if (aiQuestData) {
            questData = aiQuestData;
          } else {
            error = aiQuestError || regularQuestError;
          }
        }

        if (!questData) {
          throw error || new Error("Quest not found");
        }
        
        setQuest(questData);

        // Check if user has already submitted
        const { data: existingSubmission } = await supabase
          .from("Submissions")
          .select("id")
          .eq("quest_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingSubmission) {
          toast({
            title: "Already Submitted",
            description: "You have already submitted for this quest.",
            variant: "destructive",
          });
          navigate(`/quest/${id}`);
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
          const { latitude, longitude } = position.coords;
          setGeoLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          toast({
            title: "Location Added",
            description: "Your current location has been added to the submission.",
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location Error",
            description: "Could not get your location. You can enter it manually.",
            variant: "destructive",
          });
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
      const { error: submitError } = await supabase
        .from("Submissions")
        .insert({
          quest_id: quest.id,
          user_id: user.id,
          description: description.trim(),
          photo_url: photoUrl,
          geo_location: geoLocation.trim() || null,
          status: 'pending'
        });

      if (submitError) throw submitError;

      toast({
        title: "Quest Submitted!",
        description: "Your submission has been sent for review. You'll be notified once it's verified.",
      });

      navigate(`/quest/${quest.id}`);
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
            onClick={() => navigate(`/quest/${id}`)}
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