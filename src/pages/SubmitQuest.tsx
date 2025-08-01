import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Camera, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [geoLocation, setGeoLocation] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchQuest = async () => {
      if (!id) return;

      try {
        const { data: questData, error } = await supabase
          .from("Quests")
          .select("id, title, description")
          .eq("id", id)
          .single();

        if (error) throw error;
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
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
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
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
            <CardTitle className="text-xl text-gray-900">
              Submitting for: {quest.title}
            </CardTitle>
            <CardDescription className="text-gray-600">
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
                <Label htmlFor="photo">Photo/Video Evidence</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="photo" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, MP4 (MAX. 10MB)</p>
                      </div>
                      <input
                        id="photo"
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                  {previewUrl && (
                    <div className="mt-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
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
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
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