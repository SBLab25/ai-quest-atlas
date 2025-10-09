import { supabase } from "@/integrations/supabase/client";

export const addNewBadges = async () => {
  const newBadges = [
    {
      name: "Welcome Adventurer",
      description: "Welcome to Discovery Atlas! Your journey begins now.",
      icon_url: "👋",
      quest_id: null
    },
    {
      name: "First Steps",
      description: "You've taken your first steps into the world of discovery!",
      icon_url: "👣",
      quest_id: null
    },
    {
      name: "Early Explorer",
      description: "Completed your first 3 activities. Keep exploring!",
      icon_url: "🧭",
      quest_id: null
    },
    {
      name: "Daily Visitor",
      description: "Visited the app for 7 consecutive days. Building great habits!",
      icon_url: "📅",
      quest_id: null
    },
    {
      name: "Quest Starter",
      description: "Started your first quest. Adventure awaits!",
      icon_url: "🚀",
      quest_id: null
    },
    {
      name: "First Quest Complete!",
      description: "Congratulations on completing your first quest! Welcome to the adventure community.",
      icon_url: "🏆",
      quest_id: null
    },
    {
      name: "Explorer",
      description: "Congratulations on exploring your first quest outside of your city! The world awaits.",
      icon_url: "🌍",
      quest_id: null
    },
    {
      name: "Nature Lover",
      description: "Congratulations on exploring your first nature quest! Connect with the great outdoors.",
      icon_url: "🌿",
      quest_id: null
    },
    {
      name: "Festival Goer",
      description: "Congratulations on exploring your first local festival quest! Celebrate community culture.",
      icon_url: "🎉",
      quest_id: null
    },
    {
      name: "Animal Friend",
      description: "Congratulations on exploring your first animal-related quest! Wildlife adventures await.",
      icon_url: "🦋",
      quest_id: null
    },
    {
      name: "Bee Discoverer",
      description: "Found a bee hive! You're helping track important pollinators in your area.",
      icon_url: "🐝",
      quest_id: null
    },
    {
      name: "Streak Keeper",
      description: "Maintained a 10-day streak! Consistency is key to great discoveries.",
      icon_url: "🔥",
      quest_id: null
    },
    {
      name: "Streak Master",
      description: "Amazing! You've maintained a 30-day streak. You're a true adventurer!",
      icon_url: "⭐",
      quest_id: null
    },
    {
      name: "Point Collector",
      description: "Earned your first 100 points! Keep collecting and exploring.",
      icon_url: "💎",
      quest_id: null
    }
  ];

  try {
    // First, check if badges already exist to avoid duplicates
    const { data: existingBadges, error: checkError } = await supabase
      .from('Badges')
      .select('name');

    if (checkError) {
      console.error('Error checking existing badges:', checkError);
      throw checkError;
    }

    const existingBadgeNames = existingBadges?.map(b => b.name) || [];
    const badgesToAdd = newBadges.filter(badge => !existingBadgeNames.includes(badge.name));

    if (badgesToAdd.length === 0) {
      console.log('All badges already exist');
      return existingBadges;
    }

    // Use upsert to avoid duplicates if concurrent calls happen or duplicates exist
    const { data, error } = await supabase
      .from('Badges')
      .upsert(badgesToAdd, { onConflict: 'name', ignoreDuplicates: true })
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