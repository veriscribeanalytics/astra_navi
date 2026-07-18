const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const bnFilePath = path.join(localesDir, 'bn.json');
const bn = JSON.parse(fs.readFileSync(bnFilePath, 'utf-8'));

const translations = {
  // Navigation & General
  "nav.forecast": "পূর্বাভাস",
  "nav.forecastDesc": "মাসিক এবং বার্ষিক জ্যোতিষশাস্ত্রীয় পূর্বাভাস।",
  "nav.myFamily": "আমার পরিবার",
  "nav.myFamilyDesc": "প্রিয়জনদের জন্মের বিবরণ সংরক্ষণ করুন, চার্ট দেখুন, সামঞ্জস্য পরীক্ষা করুন।",

  // Dashboard & Horoscope & Login
  "dashboard.yourGuides": "আপনার নির্দেশক",
  "dashboard.meetYourGuides": "আপনার নির্দেশকদের সাথে পরিচিত হন",
  "dashboard.guidesSubtitle": "ব্যক্তিগতকৃত নির্দেশনার জন্য একজন বিশেষজ্ঞ বেছে নিন — ক্যারিয়ার থেকে শুরু করে সম্পর্ক এবং গভীর চার্ট বিশ্লেষণ পর্যন্ত।",
  "dashboard.startChat": "চ্যাট শুরু করুন",
  "dashboard.creditSingular": "ক্রেডিট",
  "dashboard.creditPlural": "ক্রেডিট",
  "horoscope.viewFullForecast": "সম্পূর্ণ পূর্বাভাস দেখুন",
  "login.resetLinkSent": "যদি অ্যাকাউন্ট থেকে থাকে, তবে রিসেট করার নির্দেশাবলী পাঠানো হয়েছে।",

  // Chat general
  "chat.guestExpired": "প্রিভিউ মেয়াদ শেষ",
  "chat.guestPreviewMode": "প্রিভিউ মোড - বৈদিক বিশ্লেষণের জন্য পরিচয় প্রয়োজন",
  "chat.guestLoginNow": "এখনই লগইন করুন",
  "chat.emptyGreeting": "আপনাকে কী বুঝতে সাহায্য করতে পারি?",

  // Chat Avatar Questions
  "chat.avatarQuestions.navi": [
    "আজকের গ্রহের অবস্থান আমার জন্য কী অর্থ বহন করে?",
    "এই মাসে আমার জীবনের কোন ক্ষেত্রে মনোযোগ দেওয়া উচিত?",
    "আমার বর্তমান জীবনের শিক্ষা বা কর্মফল কী?",
    "আমার উপর প্রভাবশালী গ্রহের শক্তিগুলি সম্পর্কে বলুন।"
  ],
  "chat.avatarQuestions.career_mentor": [
    "আমার চার্টের সাথে কোন ক্যারিয়ারের পথটি সামঞ্জস্যপূর্ণ?",
    "পদোন্নতির জন্য জিজ্ঞাসা করার উপযুক্ত সময় কখন?",
    "আমি কি আমার বর্তমান ক্ষেত্রে সাফল্য পাব?",
    "আমার গোপন পেশাদার শক্তিগুলি কী কী?"
  ],
  "chat.avatarQuestions.relationship_guide": [
    "আমি কখন আমার জীবনসঙ্গীর দেখা পাব?",
    "আমার বর্তমান সম্পর্কটি কি সামঞ্জস্যপূর্ণ?",
    "আমার সম্পর্কের মধ্যে কোন ধরণের নিদর্শন বারবার দেখা যাচ্ছে?",
    "আমি কীভাবে আমার মানসিক বন্ধনকে আরও গভীর করতে পারি?"
  ],
  "chat.avatarQuestions.spiritual_guide": [
    "এই জীবনে আমার আত্মার উদ্দেশ্য কী?",
    "কোন আধ্যাত্মিক সাধনা আমার স্বভাবের সাথে খাপ খায়?",
    "আমি এই মুহূর্তে কীভাবে অভ্যন্তরীণ শান্তি পেতে পারি?",
    "আমি কোন অতীত জীবনের কর্মফলের মধ্য দিয়ে যাচ্ছি?"
  ],
  "chat.avatarQuestions.astro_sage": [
    "আমার মহাদশা এবং এর তাৎপর্য ব্যাখ্যা করুন।",
    "আমার লগ্ন আমার সম্পর্কে কী প্রকাশ করে?",
    "আমাকে আমার প্রধান গ্রহের দৃষ্টি বা প্রভাবগুলি বুঝিয়ে দিন।",
    "আমার চার্টে কোন কোন যোগ উপস্থিত রয়েছে?"
  ],

  // Chat Avatar Intros
  "chat.avatarIntros.navi": "আজ মহাবিশ্ব আপনার জন্য কী বার্তা নিয়ে এসেছে?",
  "chat.avatarIntros.career_mentor": "আসুন আপনার পেশাদার যাত্রা সম্পর্কে কথা বলি।",
  "chat.avatarIntros.relationship_guide": "আপনার মনে কী রয়েছে?",
  "chat.avatarIntros.spiritual_guide": "একটি দীর্ঘ শ্বাস নিন। আপনার মনে কী চলছে?",
  "chat.avatarIntros.astro_sage": "আমাকে আপনার চার্টটি দেখান — দেখা যাক গ্রহরা কী প্রকাশ করে।",

  // Chat States & Actions
  "chat.failedResponse": "প্রতিক্রিয়া পেতে ব্যর্থ হয়েছে",
  "chat.messageEdited": "বার্তাটি সম্পাদিত হয়েছে।",
  "chat.messageDeleted": "বার্তাটি মুছে ফেলা হয়েছে।",
  "chat.messagePinned": "বার্তাটি পিন করা হয়েছে।",
  "chat.messageUnpinned": "বার্তাটি আনপিন করা হয়েছে।",
  "chat.searchPlaceholder": "কথোপকথন খুঁজুন...",
  "chat.searchMessages": "বার্তা খুঁজুন",
  "chat.searchPrevious": "পূর্ববর্তী মিল",
  "chat.searchNext": "পরবর্তী মিল",
  "chat.searchClose": "অনুসন্ধান বন্ধ করুন",
  "chat.noSearchResults": "কোন ফলাফল পাওয়া যায়নি।",
  "chat.confirmDeleteMsg": "এই বার্তাটি মুছে ফেলবেন?",
  "chat.confirmDeleteYes": "হ্যাঁ",
  "chat.confirmDeleteNo": "না",
  "chat.editMessage": "বার্তা সম্পাদনা করুন",
  "chat.saveEdit": "সংরক্ষণ করুন",
  "chat.cancelEdit": "বাতিল করুন",
  "chat.editedLabel": "(সম্পাদিত)",
  "chat.exportTXT": "TXT হিসেবে এক্সপোর্ট করুন",
  "chat.exportJSON": "JSON হিসেবে এক্সপোর্ট করুন",
  "chat.copiedToClipboard": "ক্লিপবোর্ডে কপি করা হয়েছে",
  "chat.speaking": "কথা বলছে...",
  "chat.speechStopped": "কথা বলা বন্ধ হয়েছে",
  "chat.newResponseArriving": "নতুন প্রতিক্রিয়া আসছে...",
  "chat.thinkingReadingChart": "আপনার চার্ট পড়া হচ্ছে...",
  "chat.thinkingConsultingStars": "নক্ষত্রের পরামর্শ নেওয়া হচ্ছে...",
  "chat.thinkingInterpretingTransits": "গোচর বিশ্লেষণ করা হচ্ছে...",
  "chat.thinkingAligningPlanetaryData": "গ্রহের ডেটা সারিবদ্ধ করা হচ্ছে...",
  "chat.thinkingCareer": "আপনার ক্যারিয়ারের সম্ভাবনা বিশ্লেষণ করা হচ্ছে...",
  "chat.thinkingLove": "আপনার সম্পর্কের অন্তর্দৃষ্টি অন্বেষণ করা হচ্ছে...",
  "chat.thinkingStudy": "আপনার পড়াশোনা এবং শেখার পথ পর্যালোচনা করা হচ্ছে...",
  "chat.thinkingFinance": "আপনার আর্থিক সূচক পরীক্ষা করা হচ্ছে...",
  "chat.thinkingHealth": "আপনার স্বাস্থ্য এবং জীবনীশক্তি মূল্যায়ন করা হচ্ছে...",
  "chat.thinkingTiming": "অনুকূল সময় গণনা করা হচ্ছে...",
  "chat.thinkingRemedy": "আপনার জন্য প্রতিকার প্রস্তুত করা হচ্ছে...",
  "chat.thinkingGeneral": "আপনার মহাজাগতিক ব্লুপ্রিন্ট দেখা হচ্ছে...",
  "chat.thoughtProcess": "চিন্তাভাবনা প্রক্রিয়া",
  "chat.chartFactors": "এই রিডিংয়ের জন্য চার্টের উপাদানসমূহ",
  "chat.retry": "পুনরায় চেষ্টা করুন",
  "chat.copy": "কপি করুন",
  "chat.pin": "পিন করুন",
  "chat.unpin": "আনপিন করুন",
  "chat.pinMessage": "বার্তা পিন করুন",
  "chat.unpinMessage": "বার্তা আনপিন করুন",
  "chat.regenerate": "পুনরায় তৈরি করুন",
  "chat.speak": "শুনুন",
  "chat.stop": "থামুন",
  "chat.dashaNow": "এখন",
  "chat.newMessage": "নতুন",
  "chat.newMessages": "নতুন",

  // Chat Sidebar
  "chat.sidebar.newChat": "নতুন চ্যাট",
  "chat.sidebar.searchPlaceholder": "চ্যাট খুঁজুন...",
  "chat.sidebar.today": "আজ",
  "chat.sidebar.yesterday": "গতকাল",
  "chat.sidebar.previous7Days": "গত ৭ দিন",
  "chat.sidebar.older": "পুরনো",
  "chat.sidebar.noChatsYet": "এখনো কোনো চ্যাট নেই",
  "chat.sidebar.noMatchingChats": "কোনো মানানসই চ্যাট পাওয়া যায়নি",
  "chat.sidebar.tryDifferentSearch": "অন্য কোনো শব্দ দিয়ে অনুসন্ধান করার চেষ্টা করুন।",
  "chat.sidebar.startNewConversation": "উপরে একটি নতুন কথোপকথন শুরু করুন।",
  "chat.sidebar.historyLocked": "ইতিহাস লক করা আছে",
  "chat.sidebar.loginToSave": "আপনার কথোপকথন সংরক্ষণ করতে লগইন করুন।",
  "chat.sidebar.loginToUnlock": "আনলক করতে লগইন করুন",
  "chat.sidebar.downloadTxt": "TXT",
  "chat.sidebar.downloadJson": "JSON",
  "chat.sidebar.delete": "মুছে ফেলুন",
  "chat.sidebar.loadMore": "আরও লোড করুন",
  "chat.sidebar.loading": "লোড হচ্ছে...",
  "chat.sidebar.deleteChatForever": "চ্যাটটি কি চিরতরে মুছে ফেলবেন?",
  "chat.sidebar.deletePermanentWarning": "এটি স্থায়ীভাবে মুছে ফেলবে",
  "chat.sidebar.wantBackupFirst": "প্রথমে কি একটি ব্যাকআপ চান?",
  "chat.sidebar.saveAndDownload": "সংরক্ষণ ও ডাউনলোড করুন",
  "chat.sidebar.downloading": "ডাউনলোড হচ্ছে...",
  "chat.sidebar.cancel": "বাতিল",
  "chat.sidebar.deleting": "মুছে ফেলা হচ্ছে...",
  "chat.sidebar.deleteConfirm": "মুছে ফেলুন",
  "chat.sidebar.downloadHeaderPrefix": "AstraMitra চ্যাট —",
  "chat.sidebar.downloadDateLabel": "তারিখ:",
  "chat.sidebar.downloadRoleYou": "আপনি",
  "chat.sidebar.downloadRoleNavi": "Navi",

  // Chat Detail
  "chat.detail.moonSign": "চন্দ্র রাশি",
  "chat.detail.sunSign": "সূর্য রাশি",
  "chat.detail.lagna": "লগ্ন",
  "chat.detail.birthDate": "জন্ম তারিখ",
  "chat.detail.birthTime": "জন্ম সময়",
  "chat.detail.birthPlace": "জন্মস্থান",
  "chat.detail.notSet": "সেট করা হয়নি",
  "chat.detail.identityRequired": "পরিচয় প্রয়োজন",
  "chat.detail.chartContext": "চার্ট প্রসঙ্গ",
  "chat.detail.edit": "সম্পাদনা করুন",
  "chat.detail.view": "দেখুন",
  "chat.detail.chatRating": "চ্যাট রেটিং",
  "chat.detail.rateResponsesToSeeAverage": "গড় রেটিং দেখতে প্রতিক্রিয়াগুলিকে রেট দিন",
  "chat.detail.conversationStats": "কথোপকথন পরিসংখ্যান",
  "chat.detail.messages": "বার্তা",
  "chat.detail.questions": "প্রশ্নসমূহ",
  "chat.detail.topics": "বিষয়সমূহ",
  "chat.detail.noTopicsYet": "এখনো কোনো বিষয় নেই",
  "chat.detail.birthChart": "জন্ম চার্ট",
  "chat.detail.chart": "চার্ট",
  "chat.detail.closeChartContext": "চার্ট প্রসঙ্গ বন্ধ করুন",
  "chat.detail.openLargerBirthChart": "বৃহত্তর জন্ম চার্ট খুলুন",
  "chat.detail.expandedBirthChart": "সম্প্রসারিত জন্ম চার্ট",
  "chat.detail.closeExpandedChart": "সম্প্রসারিত চার্ট বন্ধ করুন",
  "chat.detail.chatSummary": "চ্যাট সারাংশ",
  "chat.detail.summaryLoading": "সারাংশ তৈরি করা হচ্ছে...",
  "chat.detail.noSummaryYet": "সারাংশ তৈরি করতে কয়েকটি বার্তা পাঠান।",
  "chat.detail.todayEnergy": "আজকের শক্তি",
  "chat.detail.todayEnergyLoading": "আজকের শক্তি লোড হচ্ছে...",
  "chat.detail.transitPlanets": "সক্রিয় গ্রহসমূহ",
  "chat.detail.transitPanchanga": "পঞ্চাঙ্গ",
  "chat.detail.notableTransits": "উল্লেখযোগ্য গোচর",

  // Forecast Navigation & Weekdays
  "forecast.next": "পরবর্তী",
  "forecast.previous": "পূর্ববর্তী",
  "forecast.overviewLabel": "ওভারভিউ",
  "forecast.today": "আজ",
  "forecast.weekLabel": "সপ্তাহ {n}",
  "forecast.legendHigh": "৭৫+",
  "forecast.legendAverage": "৪৫–৭৪",
  "forecast.legendChallenging": "< ৪৫",
  "forecast.weekdays.sun": "রবি",
  "forecast.weekdays.mon": "সোম",
  "forecast.weekdays.tue": "মঙ্গল",
  "forecast.weekdays.wed": "বুধ",
  "forecast.weekdays.thu": "বৃহস্পতি",
  "forecast.weekdays.fri": "শুক্র",
  "forecast.weekdays.sat": "শনি",

  // Family Section
  "family.myFamily": "আমার পরিবার",
  "family.subtitle": "প্রিয়জনদের জন্মের বিবরণ সংরক্ষণ করুন, চার্ট দেখুন এবং তাদের সাথে সামঞ্জস্য পরীক্ষা করুন।",
  "family.addMember": "সদস্য যোগ করুন",
  "family.editMember": "পরিবারের সদস্য সম্পাদনা করুন",
  "family.addFirstMember": "আপনার প্রথম সদস্য যোগ করুন",
  "family.empty": "এখনো কোনো পরিবারের সদস্য নেই",
  "family.emptyDesc": "কারও চার্ট দেখতে এবং সামঞ্জস্য পরীক্ষা করতে পিতা-মাতা, সঙ্গী বা বন্ধু যোগ করুন।",
  "family.freeTierUsed": "সদস্য বিনামূল্যে স্তরে ব্যবহৃত হয়েছে",
  "family.freeTierCapMessage": "বিনামূল্যে প্ল্যানে সর্বোচ্চ ৩ জন সদস্য যোগ করা যাবে। আরও যোগ করতে আপগ্রেড করুন।",
  "family.upgrade": "আরও পেতে আপগ্রেড করুন",
  "family.removeTitle": "পরিবারের সদস্যকে সরিয়ে দেবেন?",
  "family.removeConfirm": "সরিয়ে ফেলুন",
  "family.formDesc": "নির্ভরযোগ্য চার্টের জন্য সবচেয়ে নির্ভুল জন্ম সময় এবং স্থান ব্যবহার করুন।",
  "family.chartTitle": "জন্ম চার্ট",
  "family.compatibility": "সামঞ্জস্য",
  "family.compatibilityDesc": "প্রথম রিডিংয়ে ক্রেডিট কাটা হবে। একই ভাষা পুনরাবৃত্তি করা বিনামূল্যে।",

  // Slide stat verbatim
  "landing.slides[1].stat1v": "AI Navi",

  // Forecast Section
  "forecast.title": "পূর্বাভাস",
  "forecast.heading": "আপনার মহাজাগতিক পূর্বাভাস",
  "forecast.monthly": "মাসিক",
  "forecast.yearly": "বার্ষিক",
  "forecast.loading": "গ্রহের অবস্থান গণনা করা হচ্ছে...",
  "forecast.best": "সেরা",
  "forecast.worst": "চ্যালেঞ্জিং",
  "forecast.avg": "গড়",
  "forecast.trend": "প্রবণতা",
  "forecast.todaysSnapshot": "আজকের মহাজাগতিক চিত্র",
  "forecast.labelFavorable": "অনুকূল",
  "forecast.labelStable": "স্থিতিশীল তবে চাপযুক্ত",
  "forecast.labelChallenging": "চ্যালেঞ্জিং",
  "forecast.bestDay": "সেরা দিন",
  "forecast.challengingDay": "চ্যালেঞ্জিং দিন",
  "forecast.naviSuggestion": "Navi-এর পরামর্শ",
  "forecast.ctaAskNavi": "Navi-কে জিজ্ঞাসা করুন কেন",
  "forecast.ctaPlanDay": "আমার দিনের পরিকল্পনা করুন",
  "forecast.mainForecast": "প্রধান পূর্বাভাস",
  "forecast.whatItMeans": "এর অর্থ কী",
  "forecast.whatItMeansBody": "এই মুহূর্তে {planet}-এর প্রভাব সবচেয়ে বেশি। {score} স্কোরটি নির্দেশ করে যে এই শক্তি আপনার দৈনন্দিন সিদ্ধান্তগুলিকে কতটা প্রভাবিত করছে।",
  "forecast.alerts": "সতর্কতা",
  "forecast.planetReason": "গ্রহের কারণ",

  // Plans Section
  "plans.title": "আপনার মহাজাগতিক সম্ভাবনা উন্মোচন করুন",
  "plans.subtitle": "আপনার যাত্রার সাথে মানানসই প্ল্যানটি বেছে নিন। দৈনিক অন্তর্দৃষ্টি থেকে শুরু করে গভীর কুণ্ডলী বিশ্লেষণ — প্রতিটি ফিচারের মূলে রয়েছে Navi ক্রেডিট।",
  "plans.creditBalance": "Navi ক্রেডিট",
  "plans.naviCredits": "Navi ক্রেডিট",
  "plans.currentPlan": "বর্তমান প্ল্যান",
  "plans.currentPlanButton": "বর্তমান প্ল্যান",
  "plans.selectPlan": "প্ল্যান নির্বাচন করুন",
  "plans.buyCredits": "ক্রেডিট কিনুন",
  "plans.subscriptions": "সাবস্ক্রিপশন প্ল্যানসমূহ",
  "plans.creditPacks": "ক্রেডিট প্যাকসমূহ",
  "plans.subscription": "সাবক্রিপশন",
  "plans.creditPack": "ক্রেডিট প্যাক",
  "plans.price": "মূল্য",
  "plans.credits": "ক্রেডিট",
  "plans.validity": "মেয়াদ",
  "plans.tier": "স্তর",
  "plans.oneYear": "১ বছর",
  "plans.oneMonth": "১ মাস",
  "plans.days": "দিন",
  "plans.month": "মাস",
  "plans.year": "বছর",
  "plans.subscriptionExpires": "সাবস্ক্রিপশনের মেয়াদ শেষ হবে",
  "plans.creditsExpire": "ক্রেডিটের মেয়াদ শেষ হবে",
  "plans.upgradeForFeature": "আনলক করতে আপগ্রেড করুন",
  "plans.catalogUnavailable": "পণ্য ক্যাটালগ এই মুহূর্তে উপলব্ধ নেই। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
  "plans.noProductsAvailable": "এখনো কোনো প্ল্যান উপলব্ধ নেই। আসন্ন সাবস্ক্রিপশন এবং ক্রেডিট প্যাক অপশনের জন্য সাথেই থাকুন।",
  "plans.noCreditHistory": "এখনো কোনো ক্রেডিট ইতিহাস নেই",
  "plans.noCreditHistoryDesc": "আপনি যখন চ্যাট, পরামর্শ বা কুণ্ডলী বিশ্লেষণের মতো প্রিমিয়াম ফিচারগুলি ব্যবহার করবেন, তখন আপনার ক্রেডিটের ব্যবহার এখানে প্রদর্শিত হবে।",
  "plans.creditUsageHistory": "ক্রেডিট ব্যবহারের ইতিহাস",
  "plans.paymentComingSoon": "পেমেন্ট শীঘ্রই আসছে",
  "plans.paymentIntegrationNotice": "Razorpay, App Store এবং Play Store ইন্টিগ্রেশন প্রক্রিয়াধীন রয়েছে। পেমেন্ট ব্যবস্থা চালু হলে দ্রুত কেনার জন্য আপনার নির্বাচিত প্ল্যানটি সংরক্ষণ করা হবে।",
  "plans.buyButtonDisabled": "পেমেন্ট ইন্টিগ্রেশন শীঘ্রই আসছে",
  "plans.backToPlans": "প্ল্যানসমূহে ফিরে যান",
  "plans.betaNoticeTitle": "আর্লি অ্যাডাপ্টার সুবিধাসমূহ",
  "plans.betaNoticeDesc": "একজন বিটা টেস্টকারী হিসাবে, আপনি AstraMitra-এর ভবিষ্যৎ গঠনে ভূমিকা রাখবেন। আমরা যখন আনুষ্ঠানিকভাবে চালু করব, তখন প্রাথমিক সমর্থকরা একচেটিয়া সুবিধা, বিশেষ মূল্য এবং প্রতিষ্ঠাতা সদস্য হিসাবে আজীবন স্বীকৃতি পাবেন।",
  "plans.earlyAdopter": "আর্লি অ্যাডাপ্টার",
  "plans.featureUnlimitedChat": "অসীমিত Navi পরামর্শ",
  "plans.featureExtendedChat": "দৈনিক চ্যাটের বর্ধিত সময়",
  "plans.featureFullHoroscope": "সম্পূর্ণ ব্যক্তিগতকৃত দৈনিক রাশিফল",
  "plans.featureTomorrowHoroscope": "আগামীকালের পূর্বাভাস — আগে থেকেই পরিকল্পনা করুন",
  "plans.featureBasicConsult": "নির্দেশিত পরামর্শ সেশন",
  "plans.featureGuidedConsult": "অসীমিত নির্দেশিত পরামর্শ সেশন",
  "plans.featureMatchReport": "সম্পূর্ণ জোড় সামঞ্জস্য রিপোর্ট",
  "plans.featureKundliPremium": "সম্পূর্ণ কুণ্ডলী প্রিমিয়াম বিভাগ",
  "plans.featureKundliBasicPremium": "বেসিক কুণ্ডলী প্রিমিয়াম অ্যাক্সেস",
  "plans.featureDashaAnalysis": "দশা পর্যায় বিশ্লেষণ এবং অষ্টকবর্গ",
  "plans.featurePriorityAccess": "নতুন ফিচারে অগ্রাধিকার অ্যাক্সেস",
  "plans.featureChatMessages": "Navi চ্যাট বার্তা",
  "plans.featureGuidedConsults": "নির্দেশিত পরামর্শ সেশন",
  "plans.featureMatchReports": "জোড় সামঞ্জস্য রিপোর্ট",
  "plans.featureHoroscopeAccess": "সম্পূর্ণ রাশিফল এবং পূর্বাভাস অ্যাক্সেস",
  "plans.featureNoExpiry": "ক্রেডিট নির্দিষ্ট দিন পর্যন্ত বৈধ থাকবে",
  "plans.subscriptionCredits": "সাবস্ক্রিপশন",
  "plans.packCredits": "প্যাক",
  "plans.activePacks": "সক্রিয় প্যাক",
  "plans.nextRenewal": "পরবর্তী নবায়ন",
  "plans.nearestPackExpiry": "প্যাকের মেয়াদ শেষ হবে",
  "plans.saleBadge": "সেল",
  "plans.featuredBadge": "ফিচার্ড",
  "plans.creditGrant": "ক্রেডিট অনুদান",
  "plans.creditRefund": "ক্রেডিট রিফান্ড",
  "plans.creditConsume": "ব্যবহৃত ক্রেডিট",
  "plans.creditReserve": "সংরক্ষিত",
  "plans.creditExpire": "মেয়াদোত্তীর্ণ",
  "plans.balanceAfter": "ব্যালেন্স",
  "plans.filterAll": "সব",
  "plans.filterConsume": "ব্যবহার",
  "plans.filterGrant": "অনুদানসমূহ",
  "plans.filterRefund": "রিফান্ডসমূহ",
  "plans.currentSubscription": "বর্তমান সাবস্ক্রিপশন",
  "plans.currentCreditPacks": "ক্রেডিট প্যাকসমূহ",
  "plans.noSubscription": "কোনো সক্রিয় সাবস্ক্রিপশন নেই",
  "plans.noCreditPacks": "কোনো সক্রিয় ক্রেডিট প্যাক নেই",
  "plans.packExpires": "মেয়াদ শেষ হবে",
  "plans.packRemaining": "অবশিষ্ট",
  "plans.filterPurchase": "ক্রয়সমূহ",
  "plans.filterCycleReset": "চক্র রিসেট",
  "plans.oneTimeReports": "এককালীন রিপোর্টসমূহ"
};

function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const arrMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrMatch) {
      const arrKey = arrMatch[1];
      const index = parseInt(arrMatch[2]);
      if (!current[arrKey]) {
        current[arrKey] = [];
      }
      if (i === parts.length - 1) {
        current[arrKey][index] = value;
      } else {
        if (!current[arrKey][index]) {
          current[arrKey][index] = {};
        }
        current = current[arrKey][index];
      }
    } else {
      if (i === parts.length - 1) {
        current[part] = value;
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
}

for (const [key, value] of Object.entries(translations)) {
  setNestedKey(bn, key, value);
}

// Write the updated bn.json back with 2 spaces formatting
fs.writeFileSync(bnFilePath, JSON.stringify(bn, null, 2) + '\n', 'utf-8');
console.log('Successfully updated bn.json with all translations!');
