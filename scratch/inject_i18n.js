const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const newDashboardKeys = {
  "todaysEnergy": {
    "title": "Today's Energy",
    "scoreOutOf": "of 100",
    "goodTime": "Good Time",
    "alertTime": "Alert Time",
    "aiChat": "AI Chat",
    "fullReading": "Full Reading"
  },
  "weeklyChart": {
    "title": "Weekly Chart",
    "best": "Best",
    "days": {
      "mon": "MON",
      "tue": "TUE",
      "wed": "WED",
      "thu": "THU",
      "fri": "FRI",
      "sat": "SAT",
      "sun": "SUN"
    }
  },
  "lifeAreas": {
    "title": "Life Areas",
    "viewAll": "View All",
    "love": "Love",
    "career": "Career",
    "finance": "Finance",
    "health": "Health",
    "general": "General",
    "spiritual": "Spiritual",
    "statusExcellent": "Excellent",
    "statusGood": "Good",
    "statusSteadyProgress": "Steady Progress",
    "statusManageWisely": "Manage Wisely",
    "statusNeedsAttention": "Needs Attention",
    "statusCosmicEnergy": "Cosmic Energy",
    "statusIdealForMeditation": "Ideal for Meditation",
    "comingSoon": "Coming Soon"
  },
  "panchang": {
    "title": "Panchang Today",
    "tithi": "Tithi",
    "vara": "Vara",
    "nakshatra": "Nakshatra",
    "yoga": "Yoga",
    "karana": "Karana",
    "rahuKaal": "Rahu Kaal"
  },
  "compatibility": {
    "title": "Compatibility & Match",
    "viewAll": "View All",
    "gunaMilanScore": "Guna Milan Score",
    "excellentMatch": "Excellent Match",
    "goodMatch": "Good Match",
    "averageMatch": "Average Match",
    "challengingMatch": "Challenging Match",
    "harmony": "Harmony",
    "trust": "Trust",
    "understanding": "Understanding",
    "emptyTitle": "Run your first match",
    "emptyBody": "Add anyone's birth details to see how your charts align. Partner, friend, family — anyone.",
    "emptyCta": "Start a Match"
  },
  "familyFriends": {
    "title": "Family & Friends",
    "viewAll": "View All",
    "callNow": "Call Now",
    "premium": "Premium",
    "bandExcellent": "Excellent",
    "bandVeryGood": "Very Good",
    "bandGood": "Good",
    "bandGreat": "Great",
    "bandStable": "Stable",
    "bandAverage": "Average",
    "bandChallenging": "Challenging",
    "addMember": "Add Member"
  },
  "myChart": {
    "title": "My Chart",
    "viewDetails": "View Details",
    "yourKundli": "Your Kundli",
    "lagna": "Lagna",
    "mahadasha": "Mahadasha",
    "antardasha": "Antardasha",
    "exploreFullAnalysis": "Explore Full Analysis",
    "emptyTitle": "Complete your birth details",
    "emptyBody": "Your kundli unlocks once we have your birth date, time, and location.",
    "emptyCta": "Update Profile"
  },
  "aiAstrologer": {
    "title": "AI Astrologer",
    "howItWorks": "How it Works?",
    "freeFirstQuestion": "Free First Question",
    "guides": {
      "navi": { "name": "Navi", "title": "Vedic Expert" },
      "relationship_guide": { "name": "Meera", "title": "Relationship" },
      "career_mentor": { "name": "Arya", "title": "Career Expert" },
      "spiritual_guide": { "name": "Anand", "title": "Wealth Guide" },
      "finance_mentor": { "name": "Vidya", "title": "Nadi Expert" },
      "astro_sage": { "name": "Rishi", "title": "KP Specialist" }
    }
  }
};

const locales = ['en', 'hi', 'bn', 'gu', 'kn', 'ko', 'ml', 'mr', 'pa', 'ta', 'te'];

locales.forEach(loc => {
  const filePath = path.join(localesDir, `${loc}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(fileData);
      json.newDashboard = newDashboardKeys;
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`Successfully injected newDashboard keys into ${loc}.json`);
    } catch (e) {
      console.error(`Failed to inject into ${loc}.json:`, e);
    }
  } else {
    console.warn(`${loc}.json does not exist at ${filePath}`);
  }
});
