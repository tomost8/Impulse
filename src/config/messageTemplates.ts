interface DailyMessage {
  week: number;
  day: number;
  message: string;
  type: 'morning' | 'afternoon';
}

export const dailyMessages: DailyMessage[] = [
  // Morning messages - Week 1
  { week: 1, day: 1, message: "Happy Monday! Set your sights on your goals for today", type: 'morning' },
  { week: 1, day: 2, message: "Tuesday check-in!—let's keep the momentum going with your daily schedule", type: 'morning' },
  { week: 1, day: 3, message: "Halfway there! Map out today's activities to finish the week on a high", type: 'morning' },
  { week: 1, day: 4, message: "Almost there! Plan out today's tasks and keep the progress going", type: 'morning' },
  { week: 1, day: 5, message: "It's Friday! Plan your day, follow through, and end the week with a win", type: 'morning' },
  { week: 1, day: 6, message: "Weekend mode on! Let's keep the progress rolling, small steps are better than none", type: 'morning' },
  { week: 1, day: 7, message: "Sunday reset! Set today's goals and prep for an amazing new week", type: 'morning' },

  // Morning messages - Week 2
  { week: 2, day: 1, message: "Ready to tackle Monday? Let's set up your day", type: 'morning' },
  { week: 2, day: 2, message: "Another day, another chance! Set your activities and stay on track", type: 'morning' },
  { week: 2, day: 3, message: "Happy Hump Day! Set today's schedule to stay focused and moving forward", type: 'morning' },
  { week: 2, day: 4, message: "Momentum Thursday! Set your daily tasks and keep that momentum going", type: 'morning' },
  { week: 2, day: 5, message: "One last push! Set today's activities and finish off the week strong", type: 'morning' },
  { week: 2, day: 6, message: "It's Saturday! What goals will you work on today to keep the momentum", type: 'morning' },
  { week: 2, day: 7, message: "Reflect and plan! Let's make today count toward next week's goals", type: 'morning' },

  // Morning messages - Week 3
  { week: 3, day: 1, message: "Mondays are for new beginnings. Let's get your day lined up", type: 'morning' },
  { week: 3, day: 2, message: "Make today count! Set up your activities and take one more step toward your goals", type: 'morning' },
  { week: 3, day: 3, message: "Midweek motivation! What's on today's list to move closer to your goals", type: 'morning' },
  { week: 3, day: 4, message: "Almost Friday! Plan today's steps and end the week strong", type: 'morning' },
  { week: 3, day: 5, message: "Celebrate Friday by making today's steps meaningful toward your goals", type: 'morning' },
  { week: 3, day: 6, message: "Stay on track! Your goals don't take a break—what's on the list for today", type: 'morning' },
  { week: 3, day: 7, message: "Sunday vibes! Wrap up or start your week by setting goals and reflecting on your wins", type: 'morning' },

  // Morning messages - Week 4
  { week: 4, day: 1, message: "New week, new possibilities! Map out today's steps toward your goals", type: 'morning' },
  { week: 4, day: 2, message: "Stay focused! Lock in today's activities and keep pushing toward your dreams", type: 'morning' },
  { week: 4, day: 3, message: "Power through Wednesday! Map out today's activities to stay on track", type: 'morning' },
  { week: 4, day: 4, message: "The weekend's near! Set your activities for today and make progress count", type: 'morning' },
  { week: 4, day: 5, message: "Ready for the weekend? Set today's goals to finish the week on a high", type: 'morning' },
  { week: 4, day: 6, message: "Weekend warrior! Map out today's goals and keep the momentum going", type: 'morning' },
  { week: 4, day: 7, message: "A perfect Sunday is moving a step closer to your goals. What's on today's list", type: 'morning' },

  // Morning messages - Week 5
  { week: 5, day: 1, message: "Begin the week with purpose! Lock in today's activities and start strong", type: 'morning' },
  { week: 5, day: 2, message: "Ready to conquer the day? Lock in your activities and keep that momentum going", type: 'morning' },
  { week: 5, day: 3, message: "Happy Hump Day! Small steps build big results—let's get to it", type: 'morning' },
  { week: 5, day: 4, message: "Power up for Thursday! Make your plan for today and finish the week off strong", type: 'morning' },
  { week: 5, day: 5, message: "That Friday feeling! Set your daily goals and celebrate the week's progress", type: 'morning' },
  { week: 5, day: 6, message: "Welcome to the weekend! Keep moving toward your goals with a quick Saturday plan", type: 'morning' },
  { week: 5, day: 7, message: "It's Sunday! What's on your list to wrap up or start the week on a high note", type: 'morning' },

  // Afternoon messages
  { week: 1, day: 1, message: "Your future self will thank you for today's effort", type: 'afternoon' },
  { week: 1, day: 2, message: "Focus on progress, not perfection. Each action today matters", type: 'afternoon' },
  { week: 1, day: 3, message: "Persistence is key. Today's actions bring tomorrow's achievements", type: 'afternoon' },
  { week: 1, day: 4, message: "Every small victory today leads to big wins tomorrow!", type: 'afternoon' },
  { week: 1, day: 5, message: "Let today be the day you make progress, no matter how small", type: 'afternoon' },
  { week: 1, day: 6, message: "Success is built on consistency—make today a win!", type: 'afternoon' },
  { week: 1, day: 7, message: "Commit to your dreams with each action you take today", type: 'afternoon' },

  { week: 2, day: 1, message: "Remember why you started—let today's actions bring you one step closer", type: 'afternoon' },
  { week: 2, day: 2, message: "Dreams don't work unless you do. Let's make today productive!", type: 'afternoon' },
  { week: 2, day: 3, message: "Success is in the small things you accomplish each day", type: 'afternoon' },
  { week: 2, day: 4, message: "Today is another chance to move closer to your dreams", type: 'afternoon' },
  { week: 2, day: 5, message: "Your goals deserve your commitment. Finish today strong!", type: 'afternoon' },
  { week: 2, day: 6, message: "Believe in the power of small, consistent steps", type: 'afternoon' },
  { week: 2, day: 7, message: "Each step today brings your goals within reach!", type: 'afternoon' },

  { week: 3, day: 1, message: "You're capable of achieving greatness. Keep taking action", type: 'afternoon' },
  { week: 3, day: 2, message: "Think about the finish line. Every action today matters", type: 'afternoon' },
  { week: 3, day: 3, message: "Your hard work today is creating a better tomorrow", type: 'afternoon' },
  { week: 3, day: 4, message: "Greatness is built on daily actions—let today count", type: 'afternoon' },
  { week: 3, day: 5, message: "A journey of a thousand miles begins with one step—take it today!", type: 'afternoon' },
  { week: 3, day: 6, message: "Every challenge you tackle today makes you stronger tomorrow", type: 'afternoon' },
  { week: 3, day: 7, message: "Trust the process. Keep putting in the effort, it all adds up", type: 'afternoon' },

  { week: 4, day: 1, message: "Stay consistent, stay dedicated, and keep moving forward", type: 'afternoon' },
  { week: 4, day: 2, message: "Halfway through the day, but the journey continues! Let's finish strong", type: 'afternoon' },
  { week: 4, day: 3, message: "Progress isn't always easy, but every step counts!", type: 'afternoon' },
  { week: 4, day: 4, message: "Success is built on daily efforts—let's make today count", type: 'afternoon' },
  { week: 4, day: 5, message: "With every effort, you're shaping your success story", type: 'afternoon' },
  { week: 4, day: 6, message: "Keep up the momentum! Each task completed is a win toward your goal", type: 'afternoon' },
  { week: 4, day: 7, message: "The best way to predict the future is to create it—one step at a time", type: 'afternoon' },

  { week: 5, day: 1, message: "Remember, hard work beats talent when talent doesn't work hard", type: 'afternoon' },
  { week: 5, day: 2, message: "What you do today creates the life you want tomorrow", type: 'afternoon' },
  { week: 5, day: 3, message: "Stay dedicated, stay consistent, stay strong", type: 'afternoon' },
  { week: 5, day: 4, message: "You're closer than you were yesterday. Keep pushing forward!", type: 'afternoon' },
  { week: 5, day: 5, message: "Don't just dream it, work for it. Let's make today count", type: 'afternoon' },
  { week: 5, day: 6, message: "You're capable of amazing things! Let's make every moment count", type: 'afternoon' },
  { week: 5, day: 7, message: "Keep pushing—every action today brings you closer to your goal", type: 'afternoon' }
]; 