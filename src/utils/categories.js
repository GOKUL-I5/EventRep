export const categories = [
  { id: 'all', name: 'All Events', color: 'var(--color-accent)' },
  { id: 'music_concert', name: 'Music Concert', color: '#ec4899' },
  { id: 'tech_conference', name: 'Tech Conference', color: '#3b82f6' },
  { id: 'startup_meetup', name: 'Startup Meetup', color: '#6366f1' },
  { id: 'hackathon', name: 'Hackathon', color: '#10b981' },
  { id: 'ai_workshop', name: 'AI Workshop', color: '#8b5cf6' },
  { id: 'web_bootcamp', name: 'Web Development Bootcamp', color: '#f59e0b' },
  { id: 'college_symposium', name: 'College Symposium', color: '#84cc16' },
  { id: 'cultural_festival', name: 'Cultural Festival', color: '#f43f5e' },
  { id: 'food_festival', name: 'Food Festival', color: '#f97316' },
  { id: 'gaming_tournament', name: 'Gaming Tournament', color: '#a855f7' },
  { id: 'sports_tournament', name: 'Sports Tournament', color: '#eab308' },
  { id: 'business_summit', name: 'Business Summit', color: '#3b82f6' },
  { id: 'photography_workshop', name: 'Photography Workshop', color: '#14b8a6' },
  { id: 'digital_marketing', name: 'Digital Marketing Seminar', color: '#0ea5e9' },
  { id: 'career_fair', name: 'Career Fair', color: '#22c55e' },
  { id: 'fashion_show', name: 'Fashion Show', color: '#d946ef' },
  { id: 'ngo_event', name: 'NGO Event', color: '#10b981' },
  { id: 'community_meetup', name: 'Community Meetup', color: '#06b6d4' },
  { id: 'wedding_expo', name: 'Wedding Expo', color: '#f43f5e' },
  { id: 'health_fitness', name: 'Health & Fitness Event', color: '#84cc16' }
];

export const getCategoryData = (categoryId) => {
  return categories.find(c => c.id === categoryId) || categories[0];
};
