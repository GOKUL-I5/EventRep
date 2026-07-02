import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const cities = ['Chennai', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Coimbatore', 'Madurai', 'Kochi', 'Pune', 'Kolkata'];
const states = ['Tamil Nadu', 'Karnataka', 'Telangana', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Tamil Nadu', 'Kerala', 'Maharashtra', 'West Bengal'];

const categories = [
  'music_concert', 'tech_conference', 'startup_meetup', 'hackathon', 'ai_workshop',
  'web_bootcamp', 'college_symposium', 'cultural_festival', 'food_festival', 'gaming_tournament',
  'sports_tournament', 'business_summit', 'photography_workshop', 'digital_marketing', 'career_fair',
  'fashion_show', 'ngo_event', 'community_meetup', 'wedding_expo', 'health_fitness'
];

const adjectives = ['Grand', 'Global', 'Annual', 'Ultimate', 'International', 'Exclusive', 'Future', 'Elite', 'Mega'];
const nouns = ['Summit', 'Festival', 'Expo', 'Gala', 'Symposium', 'Meetup', 'Challenge', 'Bootcamp', 'Showcase'];

const images = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80',
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
  'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=80'
];

const tagsList = ['Tech', 'Music', 'Networking', 'Learning', 'Fun', 'Entertainment', 'Business', 'Growth', 'Community'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDate() {
  const start = new Date();
  start.setDate(start.getDate() - 30); // up to 30 days ago
  const end = new Date();
  end.setDate(end.getDate() + 90); // up to 90 days in future
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const seedDatabase = async () => {
  try {
    const batch = writeBatch(db);
    const eventsRef = collection(db, 'events');

    for (let i = 0; i < 100; i++) {
      const cityIndex = getRandomInt(0, cities.length - 1);
      const city = cities[cityIndex];
      const state = states[cityIndex];
      const capacity = getRandomInt(50, 1000);
      const registeredCount = getRandomInt(0, capacity);
      
      const eventDateObj = generateDate();
      const isPast = eventDateObj < new Date();
      
      let status = 'upcoming';
      if (isPast) status = 'completed';
      else if (Math.random() > 0.8) status = 'live';

      const eventData = {
        title: `${getRandomItem(adjectives)} ${getRandomItem(categories).split('_').join(' ').toUpperCase()} ${getRandomItem(nouns)}`,
        description: `Join us for an amazing experience at the heart of ${city}. This event will feature industry leaders, great networking opportunities, and unforgettable memories. Don't miss out on the biggest gathering of the year!`,
        category: getRandomItem(categories),
        imageUrl: getRandomItem(images),
        galleryUrls: [getRandomItem(images), getRandomItem(images), getRandomItem(images)],
        date: eventDateObj.toISOString().split('T')[0],
        time: `${getRandomInt(9, 18)}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
        city,
        state,
        country: 'India',
        venue: `The Grand Venue, ${city}`,
        location: `${city}, ${state}, India`,
        organizerName: `Organizer ${getRandomInt(1, 50)}`,
        organizerEmail: `contact@organizer${getRandomInt(1,50)}.com`,
        organizerPhone: `+91 9876543${getRandomInt(100,999)}`,
        price: Math.random() > 0.3 ? getRandomInt(10, 500) * 10 : 0, // 30% free, 70% paid (100 to 5000)
        capacity,
        availableSeats: capacity - registeredCount,
        registeredCount,
        status,
        isFeatured: Math.random() > 0.8,
        isTrending: Math.random() > 0.7,
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
        reviewsCount: getRandomInt(0, 500),
        tags: [getRandomItem(tagsList), getRandomItem(tagsList)],
        schedule: [
          { time: "10:00 AM", title: "Gates Open", description: "Registration and welcome drinks." },
          { time: "11:00 AM", title: "Main Event Starts", description: "Opening keynote and introduction." },
          { time: "01:00 PM", title: "Networking Lunch", description: "Lunch break with peers." },
          { time: "04:00 PM", title: "Closing Ceremony", description: "Awards and final thoughts." }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const newEventRef = doc(eventsRef); // Auto-generate ID
      batch.set(newEventRef, eventData);
    }

    await batch.commit();
    console.log("Successfully seeded 100 events into Firestore.");
    return true;
  } catch (error) {
    console.error("Error seeding database: ", error);
    throw error;
  }
};
