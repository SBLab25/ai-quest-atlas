import { supabase } from "@/integrations/supabase/client";

export const addNewBadges = async () => {
  const newBadges = [
    {
      name: "First Quest Complete!",
      description: "Congratulations on completing your first quest! Welcome to the adventure community.",
      icon_url: "🏆"
    },
    {
      name: "Explorer",
      description: "Congratulations on exploring your first quest outside of your city! The world awaits.",
      icon_url: "🌍"
    },
    {
      name: "Nature Lover",
      description: "Congratulations on exploring your first nature quest! Connect with the great outdoors.",
      icon_url: "🌿"
    },
    {
      name: "Festival Goer",
      description: "Congratulations on exploring your first local festival quest! Celebrate community culture.",
      icon_url: "🎉"
    },
    {
      name: "Animal Friend",
      description: "Congratulations on exploring your first animal-related quest! Wildlife adventures await.",
      icon_url: "🦋"
    },
    {
      name: "Bee Discoverer",
      description: "Found a bee hive! You're helping track important pollinators in your area.",
      icon_url: "🐝"
    }
  ];

  try {
    const { data, error } = await supabase
      .from('Badges')
      .insert(newBadges)
      .select();

    if (error) {
      console.error('Error adding badges:', error);
      throw error;
    }

    console.log('Successfully added badges:', data);
    return data;
  } catch (error) {
    console.error('Failed to add new badges:', error);
    throw error;
  }
};