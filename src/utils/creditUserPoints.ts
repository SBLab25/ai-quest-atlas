import { supabase } from "@/integrations/supabase/client";

/**
 * Credit points to a user by username
 * This updates the user's localStorage points data
 */
export async function creditUserPoints(
  username: string,
  pointsToAdd: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Find user by username OR full_name (try both for flexibility)
    const searchTerm = username.trim();
    
    // Try username first (exact match is better)
    let { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .ilike("username", searchTerm)
      .limit(1);

    // If not found by username, try full_name
    if ((!profiles || profiles.length === 0) && profileError === null) {
      const { data: profilesByName, error: nameError } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .ilike("full_name", searchTerm)
        .limit(1);
      
      if (!nameError && profilesByName && profilesByName.length > 0) {
        profiles = profilesByName;
        profileError = null;
      }
    }

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return { success: false, message: `Error fetching user profile: ${profileError.message}` };
    }

    if (!profiles || profiles.length === 0) {
      return { success: false, message: `User "${username}" not found. Try searching by username or full name.` };
    }

    const userId = profiles[0].id;
    
    // First, try to get current shopping_points from database (profiles table)
    // If that doesn't work, fall back to localStorage
    let currentShoppingPoints = 0;
    
    try {
      // Try to get from profiles table if shopping_points column exists
      const { data: profile, error: profileDataError } = await supabase
        .from("profiles")
        .select("shopping_points")
        .eq("id", userId)
        .single();
      
      if (!profileDataError && profile?.shopping_points !== undefined && profile.shopping_points !== null) {
        currentShoppingPoints = profile.shopping_points || 0;
      } else {
        // Fallback to localStorage if database doesn't have the column
        const storageKey = `user_points_${userId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const currentPoints = JSON.parse(stored);
          currentShoppingPoints = currentPoints.shopping_points || 0;
        }
      }
    } catch (e) {
      console.warn("Could not fetch shopping_points from database, using localStorage:", e);
      // Fallback to localStorage
      const storageKey = `user_points_${userId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const currentPoints = JSON.parse(stored);
        currentShoppingPoints = currentPoints.shopping_points || 0;
      }
    }

    // Add points
    const newShoppingPoints = currentShoppingPoints + pointsToAdd;

    // Save to database (profiles table) - try to update shopping_points column
    let dbUpdateSuccess = false;
    try {
      const { error: updateError, data: updateData } = await supabase
        .from("profiles")
        .update({ shopping_points: newShoppingPoints })
        .eq("id", userId)
        .select();

      if (updateError) {
        // Check if it's an RLS policy error or column doesn't exist
        if (updateError.code === '42501' || updateError.message?.includes('permission')) {
          return { 
            success: false, 
            message: `Permission denied. Admin may need RLS policy to update shopping_points. Error: ${updateError.message}` 
          };
        } else if (updateError.code === '42703') {
          // Column doesn't exist
          console.warn("shopping_points column doesn't exist in database. Please run ADD_SHOPPING_POINTS_COLUMN.sql");
          return { 
            success: false, 
            message: "Database column 'shopping_points' doesn't exist. Please run the SQL migration script first." 
          };
        } else {
          console.error("Database update error:", updateError);
          return { 
            success: false, 
            message: `Failed to update database: ${updateError.message}` 
          };
        }
      } else {
        dbUpdateSuccess = true;
      }
    } catch (dbError: any) {
      console.error("Database update exception:", dbError);
      return { 
        success: false, 
        message: `Database error: ${dbError.message || 'Unknown error'}` 
      };
    }

    // Also update localStorage for immediate sync in admin's browser
    const storageKey = `user_points_${userId}`;
    let currentPoints;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        currentPoints = JSON.parse(stored);
      } else {
        currentPoints = {
          total_points: 0,
          shopping_points: 0,
          daily_visit_points: 0,
          quest_completion_points: 0,
          exercise_quota_points: 0,
          streak_bonus_points: 0,
          last_visit_date: null,
          last_quest_date: null,
          last_exercise_date: null,
        };
      }
    } catch (e) {
      currentPoints = {
        total_points: 0,
        shopping_points: 0,
        daily_visit_points: 0,
        quest_completion_points: 0,
        exercise_quota_points: 0,
        streak_bonus_points: 0,
        last_visit_date: null,
        last_quest_date: null,
        last_exercise_date: null,
      };
    }
    
    currentPoints.shopping_points = newShoppingPoints;
    localStorage.setItem(storageKey, JSON.stringify(currentPoints));
    
    // Trigger a custom event to notify components that points were updated
    window.dispatchEvent(new CustomEvent('pointsUpdated', { 
      detail: { userId, newShoppingPoints } 
    }));

    // Only return success if database update succeeded
    if (!dbUpdateSuccess) {
      return {
        success: false,
        message: "Failed to save points to database. Points were not credited.",
      };
    }

    return {
      success: true,
      message: `Successfully credited ${pointsToAdd} shopping points to ${profiles[0].full_name || profiles[0].username || username}. New balance: ${newShoppingPoints}`,
    };
  } catch (error) {
    console.error("Error crediting points:", error);
    return { success: false, message: "Unexpected error occurred" };
  }
}

/**
 * Credit points to current logged-in user (for admin testing)
 */
export async function creditCurrentUserPoints(pointsToAdd: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No user logged in");
    return;
  }

  const storageKey = `user_points_${user.id}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    let currentPoints;
    
    if (stored) {
      currentPoints = JSON.parse(stored);
    } else {
      currentPoints = {
        total_points: 0,
        shopping_points: 0,
        daily_visit_points: 0,
        quest_completion_points: 0,
        exercise_quota_points: 0,
        streak_bonus_points: 0,
        last_visit_date: null,
        last_quest_date: null,
        last_exercise_date: null,
      };
    }
    
    currentPoints.total_points += pointsToAdd;
    currentPoints.quest_completion_points += pointsToAdd;
    
    localStorage.setItem(storageKey, JSON.stringify(currentPoints));
    console.log(`Credited ${pointsToAdd} points. New total: ${currentPoints.total_points}`);
  } catch (error) {
    console.error("Error crediting points:", error);
  }
}
