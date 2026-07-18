const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');
const taFilePath = path.join(localesDir, 'ta.json');
const ta = JSON.parse(fs.readFileSync(taFilePath, 'utf-8'));

const translations = {
  // Navigation & General
  "nav.forecast": "கணிப்புகள்",
  "nav.forecastDesc": "மாதாந்திர மற்றும் வருடாந்திர ஜோதிட கணிப்புகள்.",
  "nav.myFamily": "என் குடும்பம்",
  "nav.myFamilyDesc": "அன்பானவர்களின் பிறப்பு விவரங்களைச் சேமிக்கவும், விளக்கப்படங்களை பார்க்கவும், பொருத்தத்தை சரிபார்க்கவும்.",

  // Dashboard
  "dashboard.yourGuides": "உங்கள் வழிகாட்டிகள்",
  "dashboard.meetYourGuides": "உங்கள் வழிகாட்டிகளைச் சந்தியுங்கள்",
  "dashboard.guidesSubtitle": "தொழில் முதல் உறவுகள் மற்றும் ஆழமான ஜாதக பகுப்பாய்வு வரை - தனிப்பயனாக்கப்பட்ட வழிகாட்டுதலுக்கு ஒரு நிபுணரைத் தேர்ந்தெடுக்கவும்.",
  "dashboard.startChat": "அரட்டையைத் தொடங்கவும்",
  "dashboard.creditSingular": "கிரெடிட்",
  "dashboard.creditPlural": "கிரெடிட்டுகள்",

  // Horoscope
  "horoscope.viewFullForecast": "முழு கணிப்பையும் காண்க",

  // Login
  "login.resetLinkSent": "கணக்கு இருந்தால், கடவுச்சொல் மீட்பு வழிமுறைகள் அனுப்பப்பட்டுள்ளன.",

  // Chat General
  "chat.guestExpired": "முன்னோட்டம் காலாவதியானது",
  "chat.guestPreviewMode": "முன்னோட்ட முறை - வேத பகுப்பாய்விற்கு அடையாளம் தேவை",
  "chat.guestLoginNow": "இப்போது உள்நுழைக",
  "chat.emptyGreeting": "உங்களுக்கு எதைப் புரிந்துகொள்ள நான் உதவ வேண்டும்?",

  // Chat Avatar Questions
  "chat.avatarQuestions.navi": [
    "இன்றைய கிரக சீரமைப்பு எனக்கு என்ன பலன்களைத் தரும்?",
    "இந்த மாதத்தில் என் வாழ்க்கையின் எந்தப் பகுதியில் நான் கவனம் செலுத்த வேண்டும்?",
    "என் தற்போதைய வாழ்க்கைப் பாடம் என்ன?",
    "எனது ஆதிக்கம் செலுத்தும் கிரக ஆற்றல்களைப் பற்றி கூறுங்கள்."
  ],
  "chat.avatarQuestions.career_mentor": [
    "என் குண்டலிக்கு எந்த தொழில் பாதை பொருத்தமானது?",
    "பதவி உயர்வு கேட்பதற்கு எப்போது நல்ல நேரம்?",
    "எனது தற்போதைய துறையில் நான் வெற்றி பெறுவேனா?",
    "எனது மறைந்திருக்கும் தொழில்முறை பலங்கள் என்ன?"
  ],
  "chat.avatarQuestions.relationship_guide": [
    "எனது வாழ்க்கைத்துணையை நான் எப்போது சந்திப்பேன்?",
    "எனது தற்போதைய உறவு பொருத்தமாக உள்ளதா?",
    "எனது உறவுகளில் மீண்டும் மீண்டும் தோன்றும் வடிவங்கள் என்ன?",
    "எனது உணர்வுப்பூர்வமான பிணைப்புகளை நான் எவ்வாறு ஆழமாக்குவது?"
  ],
  "chat.avatarQuestions.spiritual_guide": [
    "இந்த வாழ்க்கையில் எனது ஆன்மாவின் நோக்கம் என்ன?",
    "எனது இயல்புக்கு எந்த ஆன்மீகப் பயிற்சிகள் பொருத்தமானவை?",
    "இப்போது நான் எவ்வாறு மன அமைதியைக் கண்டறிவது?",
    "நான் எந்த கடந்த கால கர்மாவை எதிர்கொள்கிறேன்?"
  ],
  "chat.avatarQuestions.astro_sage": [
    "எனது மகாதசாவையும் அதன் விளக்கத்தையும் விளக்குங்கள்.",
    "எனது லக்னம் என்னைப்பற்றி என்ன கூறுகிறது?",
    "எனது முக்கிய கிரக பார்வைகளை விளக்குங்கள்.",
    "எனது குண்டலியில் என்னென்ன யோகங்கள் உள்ளன?"
  ],

  // Chat Avatar Intros
  "chat.avatarIntros.navi": "இன்று பிரபஞ்சம் உங்களுக்காக என்ன வைத்துள்ளது?",
  "chat.avatarIntros.career_mentor": "உங்கள் தொழில்முறை பயணத்தைப் பற்றி பேசுவோம்.",
  "chat.avatarIntros.relationship_guide": "உங்கள் மனதில் என்ன இருக்கிறது?",
  "chat.avatarIntros.spiritual_guide": "ஆழ்ந்த மூச்சு விடுங்கள். உங்கள் மனதில் என்ன ஓடிக்கொண்டிருக்கிறது?",
  "chat.avatarIntros.astro_sage": "உங்கள் குண்டலியைக் காட்டுங்கள் — கிரகங்கள் என்ன வெளிப்படுத்துகின்றன என்று பார்ப்போம்.",

  // Chat States & Actions
  "chat.failedResponse": "பதிலைப் பெறுவதில் தோல்வி",
  "chat.messageEdited": "செய்தி திருத்தப்பட்டது.",
  "chat.messageDeleted": "செய்தி நீக்கப்பட்டது.",
  "chat.messagePinned": "செய்தி பின் செய்யப்பட்டது.",
  "chat.messageUnpinned": "செய்தி அன்-பின் செய்யப்பட்டது.",
  "chat.searchPlaceholder": "உரையாடலைத் தேடுங்கள்...",
  "chat.searchMessages": "செய்திகளைத் தேடுங்கள்",
  "chat.searchPrevious": "முந்தைய பொருத்தம்",
  "chat.searchNext": "அடுத்த பொருத்தம்",
  "chat.searchClose": "தேடலை மூடு",
  "chat.noSearchResults": "முடிவுகள் எதுவும் இல்லை.",
  "chat.confirmDeleteMsg": "இந்தச் செய்தியை நீக்க வேண்டுமா?",
  "chat.confirmDeleteYes": "ஆம்",
  "chat.confirmDeleteNo": "இல்லை",
  "chat.editMessage": "செய்தியைத் திருத்து",
  "chat.saveEdit": "சேமி",
  "chat.cancelEdit": "ரத்துசெய்",
  "chat.editedLabel": "(திருத்தப்பட்டது)",
  "chat.exportTXT": "TXT ஆக ஏற்றுமதி செய்",
  "chat.exportJSON": "JSON ஆக ஏற்றுமதி செய்",
  "chat.copiedToClipboard": "கிளிப்போர்டுக்கு நகலெடுக்கப்பட்டது",
  "chat.speaking": "பேசுகிறது...",
  "chat.speechStopped": "பேச்சு நிறுத்தப்பட்டது",
  "chat.newResponseArriving": "புதிய பதில் வந்துகொண்டிருக்கிறது...",
  "chat.thinkingReadingChart": "உங்கள் குண்டலியை வாசிக்கிறது...",
  "chat.thinkingConsultingStars": "நட்சத்திரங்களை ஆலோசிக்கிறது...",
  "chat.thinkingInterpretingTransits": "கோச்சாரங்களை விளக்குகிறது...",
  "chat.thinkingAligningPlanetaryData": "கிரக தரவுகளை சீரமைக்கிறது...",
  "chat.thinkingCareer": "உங்கள் தொழில் வாய்ப்புகளை பகுப்பாய்வு செய்கிறது...",
  "chat.thinkingLove": "உங்கள் உறவு நுண்ணறிவுகளை ஆராய்கிறது...",
  "chat.thinkingStudy": "உங்கள் கல்வி மற்றும் கற்றல் பாதையை மதிப்பாய்வு செய்கிறது...",
  "chat.thinkingFinance": "உங்கள் நிதி குறிகாட்டிகளை ஆய்வு செய்கிறது...",
  "chat.thinkingHealth": "உங்கள் ஆரோக்கியம் மற்றும் உயிர்ச்சக்தியை மதிப்பிடுகிறது...",
  "chat.thinkingTiming": "உகந்த நேரத்தைக் கணக்கிடுகிறது...",
  "chat.thinkingRemedy": "உங்களுக்கான பரிகாரங்களை ஆயத்தம் செய்கிறது...",
  "chat.thinkingGeneral": "உங்கள் அண்ட வரைபடத்தை ஆலோசிக்கிறது...",
  "chat.thoughtProcess": "சிந்தனை செயல்முறை",
  "chat.chartFactors": "இந்த வாசிப்புக்கான குண்டலி காரணிகள்",
  "chat.retry": "மீண்டும் முயற்சி செய்",
  "chat.copy": "நகலெடு",
  "chat.pin": "பின் செய்",
  "chat.unpin": "அன்-பின் செய்",
  "chat.pinMessage": "செய்தியை பின் செய்",
  "chat.unpinMessage": "செய்தியை அன்-பின் செய்",
  "chat.regenerate": "மீண்டும் உருவாக்கு",
  "chat.speak": "பேசு",
  "chat.stop": "நிறுத்து",
  "chat.dashaNow": "இப்போது",
  "chat.newMessage": "புதிய செய்தி",
  "chat.newMessages": "புதிய செய்திகள்",

  // Chat Sidebar
  "chat.sidebar.newChat": "புதிய அரட்டை",
  "chat.sidebar.searchPlaceholder": "அரட்டைகளைத் தேடுங்கள்...",
  "chat.sidebar.today": "இன்று",
  "chat.sidebar.yesterday": "நேற்று",
  "chat.sidebar.previous7Days": "கடந்த 7 நாட்கள்",
  "chat.sidebar.older": "பழையவை",
  "chat.sidebar.noChatsYet": "இன்னும் அரட்டைகள் இல்லை",
  "chat.sidebar.noMatchingChats": "பொருந்தும் அரட்டைகள் இல்லை",
  "chat.sidebar.tryDifferentSearch": "வேறு தேடல் சொல்லை முயற்சிக்கவும்.",
  "chat.sidebar.startNewConversation": "மேலே ஒரு புதிய உரையாடலைத் தொடங்குங்கள்.",
  "chat.sidebar.historyLocked": "வரலாறு பூட்டப்பட்டுள்ளது",
  "chat.sidebar.loginToSave": "உங்கள் உரையாடல்களைச் சேமிக்க உள்நுழையவும்.",
  "chat.sidebar.loginToUnlock": "பூட்டைத் திறக்க உள்நுழையவும்",
  "chat.sidebar.downloadTxt": "TXT",
  "chat.sidebar.downloadJson": "JSON",
  "chat.sidebar.delete": "நீக்கு",
  "chat.sidebar.loadMore": "மேலும் ஏற்றுக",
  "chat.sidebar.loading": "ஏற்றுகிறது...",
  "chat.sidebar.deleteChatForever": "அரட்டையை நிரந்தரமாக நீக்க வேண்டுமா?",
  "chat.sidebar.deletePermanentWarning": "இது நிரந்தரமாக நீக்கிவிடும்",
  "chat.sidebar.wantBackupFirst": "முதலில் காப்புப்பிரதி வேண்டுமா?",
  "chat.sidebar.saveAndDownload": "சேமித்து பதிவிறக்கு",
  "chat.sidebar.downloading": "பதிவிறக்குகிறது...",
  "chat.sidebar.cancel": "ரத்துசெய்",
  "chat.sidebar.deleting": "நீக்குகிறது...",
  "chat.sidebar.deleteConfirm": "நீக்கு",
  "chat.sidebar.downloadHeaderPrefix": "AstraMitra அரட்டை —",
  "chat.sidebar.downloadDateLabel": "தேதி:",
  "chat.sidebar.downloadRoleYou": "நீங்கள்",
  "chat.sidebar.downloadRoleNavi": "Navi",

  // Chat Details
  "chat.detail.moonSign": "சந்திர ராசி",
  "chat.detail.sunSign": "சூரிய ராசி",
  "chat.detail.lagna": "லக்னம்",
  "chat.detail.birthDate": "பிறந்த தேதி",
  "chat.detail.birthTime": "பிறந்த நேரம்",
  "chat.detail.birthPlace": "பிறந்த இடம்",
  "chat.detail.notSet": "அமைக்கப்படவில்லை",
  "chat.detail.identityRequired": "அடையாளம் தேவை",
  "chat.detail.chartContext": "குண்டலி சூழல்",
  "chat.detail.edit": "திருத்து",
  "chat.detail.view": "காண்க",
  "chat.detail.chatRating": "அரட்டை மதிப்பீடு",
  "chat.detail.rateResponsesToSeeAverage": "சராசரியை இங்கே காண பதில்களை மதிப்பிடவும்",
  "chat.detail.conversationStats": "உரையாடல் புள்ளிவிவரங்கள்",
  "chat.detail.messages": "செய்திகள்",
  "chat.detail.questions": "கேள்விகள்",
  "chat.detail.topics": "தலைப்புகள்",
  "chat.detail.noTopicsYet": "இன்னும் தலைப்புகள் இல்லை",
  "chat.detail.birthChart": "பிறப்பு குண்டலி",
  "chat.detail.chart": "குண்டலி",
  "chat.detail.closeChartContext": "குண்டலி சூழலை மூடு",
  "chat.detail.openLargerBirthChart": "பெரிய பிறப்பு குண்டலியைத் திற",
  "chat.detail.expandedBirthChart": "விரிவாக்கப்பட்ட பிறப்பு குண்டலி",
  "chat.detail.closeExpandedChart": "விரிவாக்கப்பட்ட குண்டலியை மூடு",
  "chat.detail.chatSummary": "அரட்டை சுருக்கம்",
  "chat.detail.summaryLoading": "சுருக்கத்தை உருவாக்குகிறது...",
  "chat.detail.noSummaryYet": "சுருக்கத்தை உருவாக்க சில செய்திகளை அனுப்பவும்.",
  "chat.detail.todayEnergy": "இன்றைய ஆற்றல்",
  "chat.detail.todayEnergyLoading": "இன்றைய ஆற்றலை ஏற்றுகிறது...",
  "chat.detail.transitPlanets": "செயலில் உள்ள கிரகங்கள்",
  "chat.detail.transitPanchanga": "பஞ்சாங்கம்",
  "chat.detail.notableTransits": "குறிப்பிடத்தக்க கோச்சாரங்கள்",

  // Forecast Additions & Overrides
  "forecast.title": "கணிப்புகள்",
  "forecast.heading": "உங்கள் அண்ட கணிப்பு",
  "forecast.monthly": "மாதாந்திரம்",
  "forecast.yearly": "வருடாந்திரம்",
  "forecast.loading": "கிரக நிலைகளைக் கணக்கிடுகிறது...",
  "forecast.best": "சிறந்தது",
  "forecast.worst": "சவாலானது",
  "forecast.avg": "சராசரி",
  "forecast.trend": "போக்கு",
  "forecast.todaysSnapshot": "இன்றைய அண்ட நிலவரம்",
  "forecast.labelFavorable": "சாதகமானது",
  "forecast.labelStable": "நிலையானது ஆனால் அழுத்தமானது",
  "forecast.labelChallenging": "சவாலானது",
  "forecast.bestDay": "சிறந்த நாள்",
  "forecast.challengingDay": "சவாலான நாள்",
  "forecast.naviSuggestion": "Navi பரிந்துரைக்கிறது",
  "forecast.ctaAskNavi": "ஏன் என்று நவியிடம் கேளுங்கள்",
  "forecast.ctaPlanDay": "என் நாளைத் திட்டமிடுங்கள்",
  "forecast.mainForecast": "முதன்மை கணிப்பு",
  "forecast.whatItMeans": "இதன் பொருள் என்ன",
  "forecast.whatItMeansBody": "தற்போது {planet} முக்கிய ஆதிக்கம் செலுத்துகிறது. {score} மதிப்பெண் என்பது அந்த ஆற்றல் உங்கள் அன்றாட தேர்வுகளை எவ்வளவு வலுவாக வடிவமைக்கிறது என்பதைக் குறிக்கிறது.",
  "forecast.alerts": "எச்சரிக்கைகள்",
  "forecast.planetReason": "கிரக காரணம்",
  "forecast.next": "அடுத்து",
  "forecast.previous": "முந்தைய",
  "forecast.overviewLabel": "மேলোட்டம்",
  "forecast.today": "இன்று",
  "forecast.weekLabel": "வாரம் {n}",
  "forecast.legendHigh": "75+",
  "forecast.legendAverage": "45–74",
  "forecast.legendChallenging": "< 45",
  "forecast.weekdays.sun": "ஞாயிறு",
  "forecast.weekdays.mon": "திங்கள்",
  "forecast.weekdays.tue": "செவ்வாய்",
  "forecast.weekdays.wed": "புதன்",
  "forecast.weekdays.thu": "வியாழன்",
  "forecast.weekdays.fri": "வெள்ளி",
  "forecast.weekdays.sat": "சனி",

  // Plans Section Overrides
  "plans.title": "உங்கள் அண்ட திறனை வெளிப்படுத்துங்கள்",
  "plans.subtitle": "உங்கள் பயணத்திற்கு ஏற்ற திட்டத்தைத் தேர்ந்தெடுக்கவும். தினசரி நுண்ணறிவு முதல் ஆழமான குண்டலி பகுப்பாய்வு வரை — நவியின் கிரெடிட்டுகள் அனைத்து அம்சங்களுக்கும் ஆற்றலளிக்கின்றன.",
  "plans.creditBalance": "Navi கிரெடிட்டுகள்",
  "plans.naviCredits": "Navi கிரெடிட்டுகள்",
  "plans.currentPlan": "தற்போதைய திட்டம்",
  "plans.currentPlanButton": "தற்போதைய திட்டம்",
  "plans.selectPlan": "திட்டத்தைத் தேர்ந்தெடு",
  "plans.buyCredits": "கிரெடிட்டுகள் வாங்கு",
  "plans.subscriptions": "சந்தா திட்டங்கள்",
  "plans.creditPacks": "கிரெடிட் பேக்குகள்",
  "plans.subscription": "சந்தா",
  "plans.creditPack": "கிரெடிட் பேக்",
  "plans.price": "விலை",
  "plans.credits": "கிரெடிட்டுகள்",
  "plans.validity": "செல்லுபடியாகும் காலம்",
  "plans.tier": "அடுக்கு",
  "plans.oneYear": "1 வருடம்",
  "plans.oneMonth": "1 மாதம்",
  "plans.days": "நாட்கள்",
  "plans.month": "மாதம்",
  "plans.year": "வருடம்",
  "plans.subscriptionExpires": "சந்தா முடிவடையும் காலம்",
  "plans.creditsExpire": "கிரெடிட்டுகள் காலாவதியாகும் காலம்",
  "plans.upgradeForFeature": "அம்சத்தைத் திறக்க மேம்படுத்தவும்",
  "plans.catalogUnavailable": "தயாரிப்பு பட்டியல் தற்போது கிடைக்கவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.",
  "plans.noProductsAvailable": "இன்னும் திட்டங்கள் எதுவும் கிடைக்கவில்லை. வரவிருக்கும் சந்தா மற்றும் கிரெடிட் பேக் விருப்பங்களுக்கு இணைந்திருங்கள்.",
  "plans.noCreditHistory": "இன்னும் கிரெடிட் பயன்பாட்டு வரலாறு இல்லை",
  "plans.noCreditHistoryDesc": "அரட்டை, ஆலோசனை அல்லது குண்டலி பகுப்பாய்வு போன்ற பிரீமியம் அம்சங்களை நீங்கள் பயன்படுத்தும்போது, உங்கள் கிரெடிட் பயன்பாடு இங்கே தோன்றும்.",
  "plans.creditUsageHistory": "கிரெடிட் பயன்பாட்டு வரலாறு",
  "plans.paymentComingSoon": "கட்டண முறை விரைவில் வருகிறது",
  "plans.paymentIntegrationNotice": "Razorpay, App Store மற்றும் Play Store ஒருங்கிணைப்புகள் செயல்பாட்டில் உள்ளன. கட்டண வசதிகள் அறிமுகப்படுத்தப்படும்போது விரைவாக வாங்குவதற்கு நீங்கள் தேர்ந்தெடுத்த திட்டம் சேமிக்கப்படும்.",
  "plans.buyButtonDisabled": "கட்டண ஒருங்கிணைப்பு விரைவில் வருகிறது",
  "plans.backToPlans": "திட்டங்களுக்குத் திரும்பு",
  "plans.betaNoticeTitle": "ஆரம்பகால பயனர்களுக்கான நன்மைகள்",
  "plans.betaNoticeDesc": "ஒரு பீட்டா சோதனையாளராக, நீங்கள் AstraMitra இன் எதிர்காலத்தை வடிவமைப்பீர்கள். நாங்கள் அதிகாரப்பூர்வமாகத் தொடங்கும்போது, ஆரம்பகால ஆதரவாளர்கள் பிரத்யேக நன்மைகள், சிறப்பு விலைகள் மற்றும் நிறுவன உறுப்பினர்களாக வாழ்நாள் அங்கீகாரத்தைப் பெறுவார்கள்.",
  "plans.earlyAdopter": "ஆரம்பகால பயனர்",
  "plans.featureUnlimitedChat": "வரம்பற்ற Navi ஆலோசனைகள்",
  "plans.featureExtendedChat": "தினசரி அரட்டைக்கான கூடுதல் அணுகல்",
  "plans.featureFullHoroscope": "முழுமையான தனிப்பயனாக்கப்பட்ட தினசரி ஜாதகம்",
  "plans.featureTomorrowHoroscope": "நாளைக்கான கணிப்புகள் — முன்கூட்டியே திட்டமிடுங்கள்",
  "plans.featureBasicConsult": "வழிகாட்டப்பட்ட ஆலோசனை அமர்வுகள்",
  "plans.featureGuidedConsult": "வரம்பற்ற வழிகாட்டப்பட்ட ஆலோசனை அமர்வுகள்",
  "plans.featureMatchReport": "முழுமையான பொருத்தப் பொருத்தம் அறிக்கைகள்",
  "plans.featureKundliPremium": "முழு குண்டலி பிரீமியம் பிரிவுகள்",
  "plans.featureKundliBasicPremium": "அடிப்படை குண்டலி பிரீமியம் அணுகல்",
  "plans.featureDashaAnalysis": "தசா கால பகுப்பாய்வு & அஷ்டகவர்க்கம்",
  "plans.featurePriorityAccess": "புதிய அம்சங்களுக்கு முன்னுரிமை அணுகல்",
  "plans.featureChatMessages": "Navi அரட்டை செய்திகள்",
  "plans.featureGuidedConsults": "வழிகாட்டப்பட்ட ஆலோசனை அமர்வுகள்",
  "plans.featureMatchReports": "பொருத்தப் பொருத்தம் அறிக்கைகள்",
  "plans.featureHoroscopeAccess": "முழு ஜாதகம் & கணிப்பு அணுகல்",
  "plans.featureNoExpiry": "கிரெடிட்டுகள் குறிப்பிட்ட நாட்களுக்குச் செல்லுபடியாகும்",
  "plans.subscriptionCredits": "சந்தா",
  "plans.packCredits": "பேக்",
  "plans.activePacks": "செயலில் உள்ள பேக்(கள்)",
  "plans.nextRenewal": "அடுத்த புதுப்பித்தல்",
  "plans.nearestPackExpiry": "பேக் காலாவதியாகும் காலம்",
  "plans.saleBadge": "விற்பனை",
  "plans.featuredBadge": "சிறப்பு",
  "plans.creditGrant": "கிரெடிட் வழங்கல்",
  "plans.creditRefund": "கிரெடிட் திரும்பப்பெறல்",
  "plans.creditConsume": "பயன்படுத்தப்பட்ட கிரெடிட்",
  "plans.creditReserve": "முன்பதிவு செய்யப்பட்டுள்ளது",
  "plans.creditExpire": "காலாவதியானது",
  "plans.balanceAfter": "இருப்பு",
  "plans.filterAll": "அனைத்தும்",
  "plans.filterConsume": "பயன்பாடு",
  "plans.filterGrant": "வழங்கல்கள்",
  "plans.filterRefund": "திரும்பப்பெறல்கள்",
  "plans.currentSubscription": "தற்போதைய சந்தா",
  "plans.currentCreditPacks": "கிரெடிட் பேக்குகள்",
  "plans.noSubscription": "செயலில் உள்ள சந்தா எதுவும் இல்லை",
  "plans.noCreditPacks": "செயலில் உள்ள கிரெடிட் பேக்குகள் எதுவும் இல்லை",
  "plans.packExpires": "காலாவதியாகிறது",
  "plans.packRemaining": "மீதமுள்ளது",
  "plans.filterPurchase": "கொள்முதல்கள்",
  "plans.filterCycleReset": "சுழற்சி மீட்டமைப்பு",
  "plans.oneTimeReports": "ஒருமுறை அறிக்கைகள்",

  // Family Section
  "family.myFamily": "என் குடும்பம்",
  "family.subtitle": "அன்பானவர்களின் பிறப்பு விவரங்களைச் சேமிக்கவும், விளக்கப்படங்களைப் பார்க்கவும் மற்றும் பொருத்தத்தை சரிபார்க்கவும்.",
  "family.addMember": "உறுப்பினரைச் சேர்",
  "family.editMember": "குடும்ப உறுப்பினரைத் திருத்து",
  "family.addFirstMember": "உங்கள் முதல் உறுப்பினரைச் சேர்க்கவும்",
  "family.empty": "இன்னும் குடும்ப உறுப்பினர்கள் இல்லை",
  "family.emptyDesc": "விளக்கப்படத்தைப் பார்க்கவும் பொருத்தத்தை சரிபார்க்கவும் பெற்றோர், துணை அல்லது நண்பரைச் சேர்க்கவும்.",
  "family.freeTierUsed": "இலவச அடுக்கில் பயன்படுத்தப்பட்ட உறுப்பினர்கள்",
  "family.freeTierCapMessage": "இலவசத் திட்டம் 3 உறுப்பினர்கள் வரை ஆதரிக்கிறது. மேலும் சேர்க்க மேம்படுத்தவும்.",
  "family.upgrade": "மேலும் பெற மேம்படுத்தவும்",
  "family.removeTitle": "குடும்ப உறுப்பினரை நீக்க வேண்டுமா?",
  "family.removeConfirm": "நீக்கு",
  "family.formDesc": "நம்பகமான விளக்கப்படங்களுக்கு மிகவும் துல்லியமான பிறந்த நேரம் மற்றும் இடத்தைப் பயன்படுத்தவும்.",
  "family.chartTitle": "பிறப்பு ஜாதகம்",
  "family.compatibility": "பொருத்தம்",
  "family.compatibilityDesc": "முதல் வாசிப்புக்கு கிரெடிட்டுகள் கழிக்கப்படும். அதே மொழியில் மீண்டும் பார்ப்பது இலவசம்."
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
  setNestedKey(ta, key, value);
}

// Write the updated ta.json back with 2 spaces formatting
fs.writeFileSync(taFilePath, JSON.stringify(ta, null, 2) + '\n', 'utf-8');
console.log('Successfully updated ta.json with all translations!');
