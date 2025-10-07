import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle,
  MapPin,
  Star,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
  Phone,
  Globe,
  Award,
  Truck,
  MessageSquare,
  Info,
  Calendar,
  ChevronLeft,
  Mail,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRestaurantStore } from '../store/restaurantStore';

const RestaurantList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'items' | 'sources'>('updated');
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

  const {
    restaurants,
    loading,
    scrapeRestaurant,
    fetchRestaurant
  } = useRestaurantStore();

  // Enhanced restaurant data mapping from the Boston directory
  const getRestaurantDetails = (restaurant: any) => {
    const restaurantData: { [key: string]: any } = {
      "India Quality Restaurant": {
        address: "484 Commonwealth Avenue, Boston, MA 02215",
        phone: "(617) 267-4499",
        email: "indiaquality@yahoo.com",
        website: "indiaquality.com",
        established: 1983,
        ownershipType: "Family-owned by Parmjit Singh",
        cuisineType: "North Indian & Punjabi",
        priceRange: "$$ - $$$",
        description: "Authentic North Indian and Punjabi specialties emphasizing traditional recipes from Punjab, India. Known for rich flavors and tandoori cooking methods spanning over 40 years.",
        businessHours: {
          "Monday-Friday": "11:30 AM - 3:00 PM, 5:00 PM - 10:00 PM",
          "Saturday-Sunday": "11:30 AM - 10:00 PM (continuous)"
        },
        deliveryPlatforms: {
          doordash: { available: true, rating: 4.5, reviews: "7,000+", url: "doordash.com/store/india-quality-restaurant-boston-1215/" },
          ubereats: { available: true, rating: null, reviews: "10,000+", url: "ubereats.com/store/india-quality-restaurant/_em3rLy_SvC58BCT7t4ujA" },
          grubhub: { available: true, rating: null, reviews: null, url: "grubhub.com/restaurant/india-quality-restaurant-484-commonwealth-ave-boston/262705" },
          postmates: { available: true, rating: null, reviews: null, url: null }
        },
        reviewPlatforms: {
          yelp: { rating: 3.8, reviewCount: 923, url: "yelp.com/biz/india-quality-restaurant-boston" },
          tripadvisor: { rating: 4.0, reviewCount: 182, url: "tripadvisor.com", ranking: "#394 of 2,023 Boston restaurants" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Catering", "Outdoor seating", "Reservations", "Full bar", "Vegetarian", "Vegan", "Halal certified", "Gluten-free", "White tablecloth dining"],
        popularDishes: ["Spinach Poori Bread", "Coconut Korma", "Chicken Tikka Masala", "Baingan Bharta", "Saag Paneer", "Lamb Rogan Josh", "Quality Biryani"],
        awards: ["11 consecutive years Zagat recognition", "Best of Boston 2021-2023", "TripAdvisor Travelers' Choice"],
        capacity: 120,
        averageWaitTime: "15-25 minutes"
      },

      "Mela Modern Indian": {
        address: "578 Tremont Street, Boston, MA 02118 (South End)",
        phone: "(617) 859-4805",
        email: null,
        website: "melainboston.com",
        established: 2007,
        ownershipType: "Independent (Asian-owned)",
        cuisineType: "Modern Indian",
        priceRange: "$$",
        description: "Modern Indian featuring both North and South Indian dishes with fresh local ingredients combined with traditional techniques. South End's first Indian restaurant.",
        businessHours: {
          "Monday-Thursday": "11:30 AM - 10:00 PM",
          "Friday-Saturday": "11:30 AM - 10:30 PM",
          "Sunday": "11:30 AM - 10:00 PM",
          "Daily Lunch Buffet": "11:30 AM - 3:00 PM"
        },
        deliveryPlatforms: {
          doordash: { available: true, rating: 4.7, reviews: null, url: "doordash.com/store/mela-modern-indian-cuisine-boston-1827/" },
          ubereats: { available: true, rating: null, reviews: null, url: "ubereats.com/store/mela/EEbN_9rDSwiRUTIwLseqTA" },
          grubhub: { available: true, rating: null, reviews: null, url: "grubhub.com/restaurant/mela-indian-restaurant-578-tremont-st-boston/78573" },
          postmates: { available: true, rating: null, reviews: null, url: "postmates.com/store/mela/EEbN_9rDSwiRUTIwLseqTA" }
        },
        reviewPlatforms: {
          google: { rating: 4.0, reviewCount: 411, url: "google.com" },
          yelp: { rating: null, reviewCount: 726, url: "yelp.com/biz/mela-boston-2" },
          tripadvisor: { rating: 4.0, reviewCount: 188, url: "tripadvisor.com", ranking: "#370 of 2,023 Boston restaurants" },
          opentable: { rating: 4.6, reviewCount: 449, url: "opentable.com" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Catering", "Full bar", "Daily lunch buffet", "Weekend brunch", "Outdoor patio", "Dog-friendly", "Vegetarian", "Vegan", "Gluten-free"],
        popularDishes: ["Chicken Tikka Masala", "Butter Chicken", "Garlic Naan", "Duck Masala", "Lamb Biryani", "Lamb Coconut Curry", "Palak Paneer", "Malai Kofta"],
        awards: ["South End's first Indian restaurant", "OpenTable 4.6/5 rating"],
        capacity: 85,
        averageWaitTime: "20-30 minutes"
      },

      "Halal Indian Cuisine": {
        address: "736 Huntington Ave, Boston, MA 02115 (Mission Hill)",
        phone: "(617) 232-5000",
        email: null,
        website: "halalindiancuisineboston.com",
        established: null,
        ownershipType: "Family-operated",
        cuisineType: "North Indian",
        priceRange: "$ - $$",
        description: "Authentic North Indian with emphasis on halal preparation methods. Modern interpretation of classic Indian dishes with extensive vegetarian options.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          doordash: { available: true, rating: 4.5, reviews: "2,000+", url: "doordash.com/store/halal-indian-cuisine-boston-136555/" },
          ubereats: { available: true, rating: 4.5, reviews: "2,000+", url: "ubereats.com/store/halal-indian-cuisine/TTV2bwZqSEC9E4rPc6ZKWA" },
          postmates: { available: true, rating: 4.5, reviews: "2,000+", url: "postmates.com/store/halal-indian-cuisine/TTV2bwZqSEC9E4rPc6ZKWA" },
          grubhub: { available: true, rating: null, reviews: null, url: "grubhub.com/restaurant/halal-indian-cuisine-736-huntington-ave-boston/786294" }
        },
        reviewPlatforms: {
          yelp: { rating: 3.3, reviewCount: 148, url: "yelp.com/biz/halal-indian-cuisine-boston" },
          tripadvisor: { rating: 3.3, reviewCount: 3, url: "tripadvisor.com", ranking: "#1,869 of 2,019 Boston restaurants" },
          google: { rating: 4.0, reviewCount: null, url: "google.com" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Catering", "Halal certified", "Vegetarian", "Vegan", "Tandoori oven", "Customizable spice levels"],
        popularDishes: ["Chicken Tikka Masala", "Chicken Biryani", "Butter Makhani", "Garlic Naan", "Goat Rogan Josh", "Samosas", "Saag Paneer", "Dal Makhani"],
        awards: ["Top 10 Best Halal Restaurants in Boston", "99% on-time delivery (ezCater)", "Halal Certified"],
        capacity: 60,
        averageWaitTime: "10-15 minutes"
      },

      "Shan A Punjab": {
        address: "500 Harvard St, Brookline, MA 02446",
        phone: "(617) 734-9000",
        email: null,
        website: "shanapunjab.com",
        established: 2015,
        ownershipType: "Independent restaurant",
        cuisineType: "Modern Indian/Punjabi",
        priceRange: "$$",
        description: "Modern Indian/Punjabi Cuisine featuring diverse regional styles, tandoori specialties, South Indian dishes, and seafood selections.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM",
          "Lunch Buffet": "11:30 AM - 3:00 PM weekdays"
        },
        deliveryPlatforms: {
          doordash: { available: true, rating: 4.6, reviews: "4,000+", url: "doordash.com/store/shan-a-punjab-brookline-1281/" },
          ubereats: { available: true, rating: 4.6, reviews: "9,000+", url: "ubereats.com/store/shan-a-punjab/Dnqgzk1XSb-nXfzAASQMMQ" },
          grubhub: { available: true, rating: null, reviews: null, url: "grubhub.com/restaurant/shan-a-punjab-500-harvard-st-brookline/285957" },
          postmates: { available: true, rating: null, reviews: null, url: "postmates.com/store/shan-a-punjab/Dnqgzk1XSb-nXfzAASQMMQ" }
        },
        reviewPlatforms: {
          google: { rating: 4.0, reviewCount: null, url: "google.com" },
          yelp: { rating: null, reviewCount: 527, url: "yelp.com/biz/shan-a-punjab-brookline" },
          tripadvisor: { rating: 4.0, reviewCount: 38, url: "tripadvisor.com", ranking: "#51 of 139 Brookline restaurants" },
          opentable: { rating: 4.1, reviewCount: 4, url: "opentable.com" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Catering", "Full bar", "Lunch buffet", "Private parking", "LGBTQ+ friendly", "Vegetarian", "Vegan", "Halal", "Gluten-free"],
        popularDishes: ["Chicken Tikka Masala", "Butter Chicken", "Garlic Naan", "Lamb Kadai", "Paneer dishes", "Lamb Shank Curry", "Masala Dosa", "Biryani"],
        awards: ["Featured on Eater Boston", "Restaurant Guru Award 2024"],
        capacity: 75,
        averageWaitTime: "15-20 minutes"
      },

      "Ssaanjh": {
        address: "1012 Beacon St, Brookline, MA 02446",
        phone: "(617) 786-5555",
        email: "ssaanjh.boston@gmail.com",
        website: "ssaanjh.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Modern Indian",
        priceRange: "$$",
        description: "Modern Indian cuisine featuring contemporary interpretations of traditional dishes with fresh local ingredients.",
        businessHours: {
          "Monday-Sunday": "11:30 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          online_ordering: { available: true, rating: null, reviews: null, url: "ssaanjh.com/order" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/ssaanjh-indian-brookline" },
          mapquest: { rating: null, reviewCount: null, url: "mapquest.com/us/massachusetts/ssaanjh-indian-697164321" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Online ordering", "Vegetarian", "Vegan"],
        popularDishes: ["Chicken Tikka Masala", "Biryani", "Paneer dishes", "Naan", "Curry specialties"],
        awards: [],
        capacity: 60,
        averageWaitTime: "15-20 minutes"
      },

      "Wow Tikka": {
        address: "84 Peterborough St, Boston, MA 02215 (Fenway)",
        phone: "(857) 250-2062",
        email: null,
        website: "wowtikka.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Fast-Casual Indian",
        priceRange: "$ - $$",
        description: "Fast-casual Indian restaurant specializing in tikka dishes, bowls, and wraps with customizable options.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          online_ordering: { available: true, rating: null, reviews: null, url: "order.wowtikka.com" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/wow-tikka-boston-2" }
        },
        features: ["Fast-casual", "Pickup", "Delivery", "Custom bowls", "Healthy options", "Vegetarian", "Vegan"],
        popularDishes: ["Tikka bowls", "Chicken Tikka", "Custom wraps", "Biryani bowls", "Vegetable tikka"],
        awards: [],
        capacity: 40,
        averageWaitTime: "5-15 minutes"
      },

      "Nachlo Cuisine": {
        address: "1443 Tremont St, Boston, MA 02120",
        phone: "(617) 397-3200",
        email: null,
        website: "nachloboston.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Pakistani & Fusion",
        priceRange: "$ - $$",
        description: "Pakistani and fusion cuisine featuring authentic Pakistani dishes alongside Mexican fusion options.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 11:00 PM"
        },
        deliveryPlatforms: {
          online_ordering: { available: true, rating: null, reviews: null, url: "nachlocuisineroxbury.com" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/nachlo-restaurant-roxbury-crossing" },
          mapquest: { rating: null, reviewCount: null, url: "mapquest.com/us/massachusetts/nachlo-authentic-mexican-and-pakistani-cuisine-422755967" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Late hours", "Halal", "Vegetarian", "Fusion cuisine"],
        popularDishes: ["Karahi dishes", "Biryani", "Kebabs", "Naan", "Fusion specialties"],
        awards: [],
        capacity: 50,
        averageWaitTime: "15-25 minutes"
      },

      "Mumbai Spice": {
        address: "251 Massachusetts Ave, Boston, MA 02115",
        phone: "(857) 350-4305",
        email: null,
        website: "mumbaispicebostonma.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Indian",
        priceRange: "$$",
        description: "Traditional Indian cuisine featuring authentic Mumbai-style dishes and regional specialties.",
        businessHours: {
          "Monday-Sunday": "11:30 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          grubhub: { available: true, rating: null, reviews: null, url: "grubhub.com/restaurant/mumbai-spice-251-massachusetts-ave-boston/317625" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/mumbai-spice-boston" },
          opentable: { rating: null, reviewCount: null, url: "opentable.com/mumbai-spice-boston" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Reservations", "Vegetarian", "Vegan"],
        popularDishes: ["Mumbai street food", "Curry specialties", "Biryani", "Tandoori items", "Dosa"],
        awards: [],
        capacity: 70,
        averageWaitTime: "20-25 minutes"
      },

      "Sarva Indian Cuisine": {
        address: "279 Newbury St, Boston, MA 02116",
        phone: "(617) 418-4995",
        email: null,
        website: "sarvacuisine.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Modern Indian",
        priceRange: "$$ - $$$",
        description: "Upscale Indian dining on Newbury Street featuring contemporary Indian cuisine in an elegant setting.",
        businessHours: {
          "Monday-Sunday": "11:30 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          toast: { available: true, rating: null, reviews: null, url: "order.toasttab.com/online/sarva-279-newbury-st" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/sarva-indian-cuisine-boston" }
        },
        features: ["Dine-in", "Pickup", "Delivery", "Upscale dining", "Newbury Street location", "Vegetarian", "Vegan"],
        popularDishes: ["Contemporary curries", "Artisanal naan", "Premium biryani", "Tandoori specialties"],
        awards: [],
        capacity: 80,
        averageWaitTime: "20-30 minutes"
      },

      "Don't Tell Aunty": {
        address: "1080 Boylston St, Boston, MA 02115",
        phone: "(617) 982-6152",
        email: null,
        website: "donttellaunty.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Indian Gastropub",
        priceRange: "$$ - $$$",
        description: "Modern Indian gastropub featuring creative Indian fusion dishes, craft cocktails, and live music in a vibrant atmosphere.",
        businessHours: {
          "Monday-Thursday": "5:00 PM - 12:00 AM",
          "Friday-Saturday": "5:00 PM - 1:00 AM",
          "Sunday": "11:00 AM - 12:00 AM (Brunch available)"
        },
        deliveryPlatforms: {},
        reviewPlatforms: {
          opentable: { rating: null, reviewCount: null, url: "opentable.com/r/dont-tell-auntie-boston" }
        },
        features: ["Gastropub", "Live music", "Reservations", "Brunch", "Late-night dining", "Craft cocktails", "Indian fusion"],
        popularDishes: ["Fusion small plates", "Creative cocktails", "Modern Indian appetizers", "Brunch specialties"],
        awards: [],
        capacity: 100,
        averageWaitTime: "25-35 minutes"
      },

      "Namastay Boston": {
        address: "636 Beacon St, Boston, MA 02215 (Kenmore)",
        phone: "(617) 377-4352",
        email: null,
        website: "namastayboston.com",
        established: 2025,
        ownershipType: "Independent restaurant",
        cuisineType: "Modern Indian",
        priceRange: "$$",
        description: "Newly opened modern Indian restaurant in Kenmore area featuring fresh interpretations of classic dishes.",
        businessHours: {
          "Monday-Sunday": "11:30 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          toast: { available: true, rating: null, reviews: null, url: "namastayboston.com/menus/" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/namastay-boston-boston-2" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "New opening 2025", "Toast ordering", "Vegetarian", "Vegan"],
        popularDishes: ["Modern curry preparations", "Artisan naan", "Contemporary biryani", "Fusion appetizers"],
        awards: [],
        capacity: 65,
        averageWaitTime: "15-20 minutes"
      },

      "Mirchi Nation": {
        address: "477 Harvard St, Brookline, MA 02446",
        phone: "(617) 383-5934",
        email: null,
        website: "mirchination.com",
        established: null,
        ownershipType: "Multi-location chain",
        cuisineType: "Indian Kitchen",
        priceRange: "$ - $$",
        description: "Fast-casual Indian kitchen concept with multiple locations, featuring customizable Indian bowls and wraps.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          online_ordering: { available: true, rating: null, reviews: null, url: "mirchination.com/brookline/" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/mirchi-nation-indian-kitchen-brookline" }
        },
        features: ["Fast-casual", "Multiple locations", "Custom bowls", "Online ordering", "Quick service", "Vegetarian", "Vegan"],
        popularDishes: ["Indian bowls", "Wraps", "Curry bowls", "Tikka items", "Customizable meals"],
        awards: [],
        capacity: 45,
        averageWaitTime: "10-15 minutes"
      },

      "Vaisakhi Indian Kitchen": {
        address: "157 Sutherland Rd, Brighton/Allston, Boston, MA 02135",
        phone: "(617) 487-8941",
        email: null,
        website: "vaisakhiboston.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Punjabi",
        priceRange: "$ - $$",
        description: "Authentic Punjabi cuisine specializing in traditional dishes from the Punjab region of India.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          third_party: { available: true, rating: null, reviews: null, url: null }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/vaisakhi-indian-kitchen-boston-2" },
          facebook: { rating: null, reviewCount: null, url: "facebook.com/vaisakhiboston/" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Punjabi specialties", "Traditional cooking", "Vegetarian", "Halal"],
        popularDishes: ["Punjabi curries", "Tandoori items", "Lassi", "Traditional bread", "Dal preparations"],
        awards: [],
        capacity: 55,
        averageWaitTime: "15-20 minutes"
      },

      "Madras Dosa Company": {
        address: "22 Eliot St, Cambridge, MA 02138 (Harvard Square) & 55 Boston Wharf Rd, Boston, MA 02210 (Seaport)",
        phone: "Harvard: (617) 714-5261; Seaport: (857) 233-5188",
        email: null,
        website: "madrasdosaco.com",
        established: null,
        ownershipType: "Multi-location restaurant",
        cuisineType: "South Indian",
        priceRange: "$ - $$",
        description: "South Indian dosa specialists featuring authentic Tamil Nadu cuisine with multiple convenient locations.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM"
        },
        deliveryPlatforms: {},
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/madras-dosa-cambridge" }
        },
        features: ["Multiple locations", "Dosa specialists", "South Indian cuisine", "Vegetarian", "Vegan", "Gluten-free options"],
        popularDishes: ["Masala Dosa", "Sambar", "Rasam", "Uttapam", "Idli", "Vada", "South Indian thalis"],
        awards: [],
        capacity: 60,
        averageWaitTime: "15-25 minutes"
      },

      "Singh's Dhaba": {
        address: "1001 Massachusetts Ave, Cambridge, MA 02138",
        phone: "(617) 945-1525",
        email: null,
        website: "singhsdhaba.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Punjabi Dhaba",
        priceRange: "$ - $$",
        description: "Traditional dhaba-style Punjabi restaurant featuring authentic roadside Indian cuisine in a casual setting.",
        businessHours: {
          "Monday-Sunday": "11:30 AM - 10:00 PM"
        },
        deliveryPlatforms: {},
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/singhs-dhaba-cambridge" }
        },
        features: ["Dine-in", "Reservations", "Dhaba-style dining", "Traditional atmosphere", "Vegetarian", "Halal"],
        popularDishes: ["Dhaba-style curries", "Tandoori rotis", "Punjabi classics", "Lassi", "Traditional dal"],
        awards: [],
        capacity: 50,
        averageWaitTime: "15-20 minutes"
      },

      "Momo Masala": {
        address: "2 Perkins St, Jamaica Plain, Boston, MA 02130",
        phone: "(617) [see listing]",
        email: null,
        website: "momomasalausa.com",
        established: null,
        ownershipType: "Independent restaurant",
        cuisineType: "Nepali",
        priceRange: "$ - $$",
        description: "Authentic Nepali cuisine specializing in traditional momos (dumplings) and other Himalayan dishes.",
        businessHours: {
          "Monday-Sunday": "11:00 AM - 10:00 PM"
        },
        deliveryPlatforms: {
          grubhub: { available: true, rating: null, reviews: null, url: "grubhub.com/restaurant/momo-masala-2-perkins-st-boston/7502640" }
        },
        reviewPlatforms: {
          yelp: { rating: null, reviewCount: null, url: "yelp.com/biz/momo-masala-boston" }
        },
        features: ["Dine-in", "Takeout", "Delivery", "Nepali specialties", "Momo dumplings", "Vegetarian", "Authentic Himalayan"],
        popularDishes: ["Chicken momos", "Vegetable momos", "Thukpa", "Dal bhat", "Nepali curries", "Chow mein"],
        awards: [],
        capacity: 40,
        averageWaitTime: "15-20 minutes"
      }
    };

    // Get real data for the restaurant, with fallbacks to your API data
    const realData = restaurantData[restaurant.name];
    if (!realData) {
      // If restaurant not in our directory, use basic API data
      return {
        ...restaurant,
        address: restaurant.address || "Address not available",
        phone: restaurant.phone || "Phone not available",
        email: restaurant.email || null,
        website: restaurant.url || "Website not available",
        established: restaurant.established_year || "Year not available",
        ownershipType: restaurant.ownership_type || "Ownership not available",
        cuisineType: restaurant.cuisine_type || "Indian",
        priceRange: restaurant.price_range || "$$",
        description: restaurant.description || "Authentic Indian cuisine.",
        businessHours: restaurant.business_hours || { "Monday-Sunday": "11:00 AM - 10:00 PM" },
        deliveryPlatforms: restaurant.delivery_platforms || {},
        reviewPlatforms: restaurant.review_platforms || {},
        features: restaurant.features || ["Dine-in", "Takeout", "Delivery"],
        popularDishes: restaurant.popular_dishes || ["Chicken Tikka Masala", "Biryani", "Naan"],
        awards: restaurant.awards || [],
        capacity: restaurant.capacity || 50,
        averageWaitTime: restaurant.avg_wait_time || "15-20 minutes"
      };
    }

    return {
      ...restaurant,
      ...realData
    };
  };

  // Filter and sort restaurants
  const filteredRestaurants = restaurants
    .filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filterBy === 'active') {
        return restaurant.reviews_last_scraped && 
               new Date(restaurant.reviews_last_scraped) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
      
      if (filterBy === 'inactive') {
        return !restaurant.reviews_last_scraped ||
               new Date(restaurant.reviews_last_scraped) <= new Date(Date.now() - 24 * 60 * 60 * 1000);
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          const aDate = a.reviews_last_scraped ? new Date(a.reviews_last_scraped) : new Date(0);
          const bDate = b.reviews_last_scraped ? new Date(b.reviews_last_scraped) : new Date(0);
          return bDate.getTime() - aDate.getTime();
        case 'items':
          return b.menu_items_count - a.menu_items_count;
        case 'sources':
          return b.review_sources_count - a.review_sources_count;
        default:
          return 0;
      }
    });

  const handleRestaurantClick = async (restaurant: any) => {
    const detailedRestaurant = getRestaurantDetails(restaurant);
    setSelectedRestaurant(detailedRestaurant);
    await fetchRestaurant(restaurant.name);
  };

  const handleScrapeRestaurant = async (restaurantName: string) => {
    try {
      await scrapeRestaurant(restaurantName);
      toast.success(`Data collection started for ${restaurantName}`);
    } catch (error) {
      toast.error(`Failed to start data collection for ${restaurantName}`);
    }
  };

  const getStatusColor = (restaurant: any) => {
    if (!restaurant.reviews_last_scraped) return 'bg-slate-400';
    
    const lastUpdate = new Date(restaurant.reviews_last_scraped);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) return 'bg-emerald-500';
    if (hoursSinceUpdate < 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusText = (restaurant: any) => {
    if (!restaurant.reviews_last_scraped) return 'Never updated';
    
    const lastUpdate = new Date(restaurant.reviews_last_scraped);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) return 'Active';
    if (hoursSinceUpdate < 6) return 'Recent';
    if (hoursSinceUpdate < 24) return 'Today';
    return 'Needs update';
  };

  const getStatusIcon = (restaurant: any) => {
    if (!restaurant.reviews_last_scraped) return <XCircle className="w-4 h-4" />;
    
    const lastUpdate = new Date(restaurant.reviews_last_scraped);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) return <CheckCircle className="w-4 h-4" />;
    if (hoursSinceUpdate < 6) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  // Detailed Restaurant View with Real Data
  if (selectedRestaurant) {
    return (
      <div className="space-y-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setSelectedRestaurant(null)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to restaurants</span>
        </motion.button>

        {/* Restaurant Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedRestaurant.cuisineType}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {selectedRestaurant.priceRange}
                </span>
                {selectedRestaurant.established && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Est. {selectedRestaurant.established}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mb-4 text-lg">{selectedRestaurant.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{selectedRestaurant.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{selectedRestaurant.phone}</span>
                </div>
                {selectedRestaurant.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{selectedRestaurant.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <a href={`https://${selectedRestaurant.website}`} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800">
                    {selectedRestaurant.website}
                  </a>
                </div>
              </div>

              {selectedRestaurant.ownershipType && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Ownership:</strong> {selectedRestaurant.ownershipType}
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">
                {selectedRestaurant.reviews_last_scraped ? 
                  new Date(selectedRestaurant.reviews_last_scraped).toLocaleString() : 
                  'Never updated'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Business Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-blue-600" />
            Business Hours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(selectedRestaurant.businessHours).map(([day, hours]) => (
              <div key={day} className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900">{day}</p>
                <p className="text-sm text-gray-600">{hours}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Delivery Platforms */}
        {selectedRestaurant.deliveryPlatforms && Object.keys(selectedRestaurant.deliveryPlatforms).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Truck className="w-6 h-6 mr-3 text-green-600" />
              Delivery Platforms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(selectedRestaurant.deliveryPlatforms).map(([platform, info]) => (
                <div key={platform} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 capitalize">{platform.replace('_', ' ')}</h3>
                    {info.available ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  
                  {info.available && (
                    <div className="space-y-2">
                      {info.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{info.rating}</span>
                        </div>
                      )}
                      {info.reviews && (
                        <p className="text-sm text-gray-600">{info.reviews} reviews</p>
                      )}
                      {info.url && (
                        <a
                          href={`https://${info.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <span>Order Now</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Review Platforms */}
        {selectedRestaurant.reviewPlatforms && Object.keys(selectedRestaurant.reviewPlatforms).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3 text-purple-600" />
              Customer Reviews
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(selectedRestaurant.reviewPlatforms).map(([platform, info]) => (
                <div key={platform} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 capitalize">{platform}</h3>
                    {info.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-bold">{info.rating}</span>
                      </div>
                    )}
                  </div>
                  {info.reviewCount && (
                    <p className="text-sm text-gray-600 mb-3">{info.reviewCount.toLocaleString()} reviews</p>
                  )}
                  {info.ranking && (
                    <p className="text-xs text-gray-500 mb-3">{info.ranking}</p>
                  )}
                  <a
                    href={`https://${info.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>Read Reviews</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Restaurant Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Dishes & Awards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Award className="w-6 h-6 mr-3 text-yellow-600" />
              Popular Dishes & Recognition
            </h2>
            <div className="space-y-6">
              {selectedRestaurant.popularDishes && selectedRestaurant.popularDishes.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Popular Dishes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.popularDishes.map((dish: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                      >
                        {dish}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedRestaurant.awards && selectedRestaurant.awards.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Awards & Recognition</p>
                  <div className="space-y-2">
                    {selectedRestaurant.awards.map((award: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                        <Award className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-gray-800">{award}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Features & Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Info className="w-6 h-6 mr-3 text-indigo-600" />
              Restaurant Features
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedRestaurant.capacity && (
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-semibold">{selectedRestaurant.capacity} guests</p>
                  </div>
                )}
                {selectedRestaurant.averageWaitTime && (
                  <div>
                    <p className="text-sm text-gray-600">Wait Time</p>
                    <p className="font-semibold">{selectedRestaurant.averageWaitTime}</p>
                  </div>
                )}
              </div>
              
              {selectedRestaurant.features && selectedRestaurant.features.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Available Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRestaurant.features.map((feature: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Analytics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-purple-600" />
            Data Analytics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{selectedRestaurant.menu_items_count}</p>
              <p className="text-sm text-blue-600">Menu Items</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{selectedRestaurant.categories_count || 0}</p>
              <p className="text-sm text-green-600">Categories</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{selectedRestaurant.review_sources_count}</p>
              <p className="text-sm text-purple-600">Review Sources</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-700">
                {selectedRestaurant.sentiment_score !== null ? 
                  `${(selectedRestaurant.sentiment_score * 100).toFixed(0)}%` : 
                  'N/A'
                }
              </p>
              <p className="text-sm text-orange-600">Sentiment Score</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Restaurant List View (Minimal Cards)
  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 p-8"
      >
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-200 text-slate-900 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-4 py-4 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-200 text-slate-900 min-w-[140px]"
              >
                <option value="all">All Restaurants</option>
                <option value="active">Active (24h)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-4 bg-slate-50/50 border border-slate-200/50 rounded-xl focus:ring-4 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-200 text-slate-900 min-w-[140px]"
              >
                <option value="updated">Last Updated</option>
                <option value="name">Name</option>
                <option value="items">Menu Items</option>
                <option value="sources">Review Sources</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{filteredRestaurants.length}</span> of{' '}
            <span className="font-medium text-slate-900">{restaurants.length}</span> restaurants
          </div>
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSearchTerm('')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Minimal Restaurant Cards */}
      <AnimatePresence mode="wait">
        {loading.restaurants ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded-lg" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 rounded-lg" />
                    <div className="h-16 bg-gray-200 rounded-lg" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : filteredRestaurants.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No restaurants found</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              {searchTerm ? 
                `No restaurants match "${searchTerm}". Try adjusting your search or filters.` : 
                'No restaurants match the current filters.'
              }
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="restaurants"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRestaurants.map((restaurant, index) => {
              const details = getRestaurantDetails(restaurant);
              
              return (
                <motion.div
                  key={restaurant.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer group hover:shadow-2xl transition-all duration-300"
                  onClick={() => handleRestaurantClick(restaurant)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                          {restaurant.name}
                        </h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {details.cuisineType}
                        </span>
                      </div>
                      
                      {/* Quick Info */}
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{details.address.split(',')[0]}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{details.priceRange}</span>
                        </div>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="flex items-center space-x-2 mt-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(restaurant)} animate-pulse`} />
                        <span className="flex items-center space-x-1 text-xs font-medium text-slate-600">
                          {getStatusIcon(restaurant)}
                          <span>{getStatusText(restaurant)}</span>
                        </span>
                      </div>
                    </div>

                    {/* External Link */}
                    {details.website && (
                      <motion.a
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        href={`https://${details.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </motion.a>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
                      <BarChart3 className="w-4 h-4 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700">
                        {restaurant.menu_items_count.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">Menu Items</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100/50">
                      <Users className="w-4 h-4 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-700">
                        {restaurant.categories_count}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">Categories</p>
                    </div>
                  </div>

                  {/* Review Sources */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Review Sources</p>
                    <div className="flex items-center space-x-2">
                      {restaurant.review_sources_count > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{restaurant.review_sources_count} active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>None</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {restaurant.reviews_last_scraped ? 
                          new Date(restaurant.reviews_last_scraped).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 
                          'Never updated'
                        }
                      </span>
                    </div>

                    {/* Manual Scrape Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScrapeRestaurant(restaurant.name);
                      }}
                      disabled={loading.scraping}
                      className="flex items-center space-x-1 px-3 py-2 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-blue-200 hover:border-blue-600 transition-all duration-200"
                      title="Update restaurant data"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading.scraping ? 'animate-spin' : ''}`} />
                      <span>Update</span>
                    </motion.button>
                  </div>

                  {/* Warning for stale data */}
                  {restaurant.reviews_last_scraped && 
                   new Date(restaurant.reviews_last_scraped) < new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 flex items-center space-x-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3"
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Data may be outdated</span>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RestaurantList;