import { supabase } from "@/integrations/supabase/client";

export const addNewBadges = async () => {
  const newBadges = [
    {
      name: "Welcome Adventurer",
      description: "Welcome to Discovery Atlas! Your journey begins now.",
      icon_url: "👋"
    },
    {
      name: "First Steps",
      description: "You've taken your first steps into the world of discovery!",
      icon_url: "👣"
    },
    {
      name: "Early Explorer",
      description: "Completed your first 3 activities. Keep exploring!",
      icon_url: "🧭"
    },
    {
      name: "Daily Visitor",
      description: "Visited the app for 7 consecutive days. Building great habits!",
      icon_url: "📅"
    },
    {
      name: "Quest Starter",
      description: "Started your first quest. Adventure awaits!",
      icon_url: "🚀"
    },
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
    },
    {
      name: "Streak Keeper",
      description: "Maintained a 10-day streak! Consistency is key to great discoveries.",
      icon_url: "🔥"
    },
    {
      name: "Streak Master",
      description: "Amazing! You've maintained a 30-day streak. You're a true adventurer!",
      icon_url: "⭐"
    },
    {
      name: "Point Collector",
      description: "Earned your first 100 points! Keep collecting and exploring.",
      icon_url: "💎"
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