const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Define translations for missing "dashboard" keys
const dashboardTranslations = {
  en: {
    familySubtitle: "Track emotional, karmic and compatibility patterns with your closest people.",
    familyAddSubtitle: "Add family or friends to compare charts and emotional patterns.",
    familyBondEnergy: "Bond energy",
    familyViewBond: "View bond",
    familyRunCompatibility: "Run compatibility",
    familyCompatibilityPending: "Awaiting reading",
    familyStatusIncomplete: "Incomplete",
    familyStatusNeedsAttention: "Needs attention",
    familyStatusStable: "Stable",
    familyStatusNew: "New",
    familyInviteBanner: "You have {count} family invite waiting",
    familyInviteBannerPlural: "You have {count} family invites waiting",
    familyInviteReview: "Review",
    startChat: "Start Chat",
    creditSingular: "credit",
    creditPlural: "credits"
  },
  hi: {
    familySubtitle: "अपने करीबी लोगों के साथ भावनात्मक, कर्म और अनुकूलता पैटर्न को ट्रैक करें।",
    familyAddSubtitle: "चार्ट और भावनात्मक पैटर्न की तुलना करने के लिए परिवार या दोस्तों को जोड़ें।",
    familyBondEnergy: "बंधन ऊर्जा",
    familyViewBond: "बंधन देखें",
    familyRunCompatibility: "अनुकूलता चलाएं",
    familyCompatibilityPending: "परामर्श की प्रतीक्षा है",
    familyStatusIncomplete: "अधूरा",
    familyStatusNeedsAttention: "ध्यान देने की आवश्यकता है",
    familyStatusStable: "स्थिर",
    familyStatusNew: "नया",
    familyInviteBanner: "आपके पास {count} पारिवारिक आमंत्रण लंबित है",
    familyInviteBannerPlural: "आपके पास {count} पारिवारिक आमंत्रण लंबित हैं",
    familyInviteReview: "समीक्षा करें",
    startChat: "चैट शुरू करें",
    creditSingular: "क्रेडिट",
    creditPlural: "क्रेडिट"
  },
  bn: {
    familySubtitle: "আপনার প্রিয়জনদের সাথে মানসিক, কর্মফল এবং সামঞ্জস্যের ধরণগুলি ট্র্যাক করুন।",
    familyAddSubtitle: "চার্ট এবং মানসিক ধরণ তুলনা করতে পরিবার বা বন্ধুদের যোগ করুন।",
    familyBondEnergy: "বন্ধন শক্তি",
    familyViewBond: "বন্ধন দেখুন",
    familyRunCompatibility: "সামঞ্জস্যের পরীক্ষা করুন",
    familyCompatibilityPending: "পরামর্শের অপেক্ষায়",
    familyStatusIncomplete: "অসম্পূর্ণ",
    familyStatusNeedsAttention: "মনোযোগ প্রয়োজন",
    familyStatusStable: "স্থিতিশীল",
    familyStatusNew: "নতুন",
    familyInviteBanner: "আপনার {count}টি পারিবারিক আমন্ত্রণ অমীমাংসিত রয়েছে",
    familyInviteBannerPlural: "আপনার {count}টি পারিবারিক আমন্ত্রণ অমীমাংসিত রয়েছে",
    familyInviteReview: "পর্যালোচনা",
    startChat: "চ্যাট শুরু করুন",
    creditSingular: "ক্রেডিট",
    creditPlural: "ক্রেডিট"
  },
  gu: {
    familySubtitle: "તમારા નજીકના લોકો સાથે ભાવનાત્મક, કર્મ અને અનુકૂળતા પેટર્નને ટ્રૅક કરો.",
    familyAddSubtitle: "ચાર્ટ અને ભાવનાત્મક પેટર્નની તુલના કરવા માટે કુટુંબ અથવા મિત્રોને ઉમેરો.",
    familyBondEnergy: "બોન્ડ ઉર્જા",
    familyViewBond: "બોન્ડ જુઓ",
    familyRunCompatibility: "અનુકૂળતા તપાસો",
    familyCompatibilityPending: "પરામર્શની રાહ જોવાય છે",
    familyStatusIncomplete: "અપૂર્ણ",
    familyStatusNeedsAttention: "ધ્યાન આપવાની જરૂર છે",
    familyStatusStable: "સ્થિર",
    familyStatusNew: "નવું",
    familyInviteBanner: "તમારી પાસે {count} પારિવારિક આમંત્રણ બાકી છે",
    familyInviteBannerPlural: "તમારી પાસે {count} પારિવારિક આમંત્રણો બાકી છે",
    familyInviteReview: "સમીક્ષા કરો",
    startChat: "ચેટ શરૂ કરો",
    creditSingular: "ક્રેડિટ",
    creditPlural: "ક્રેડિટส์"
  },
  kn: {
    familySubtitle: "ನಿಮ್ಮ ಹತ್ತಿರದ ಜನರೊಂದಿಗೆ ಭಾವನಾತ್ಮಕ, ಕರ್ಮ ಮತ್ತು ಹೊಂದಾಣಿಕೆಯ ಮಾದರಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
    familyAddSubtitle: "ಚಾರ್ಟ್ ಮತ್ತು ಭಾವನಾತ್ಮಕ ಮಾದರಿಗಳನ್ನು ಹೋಲಿಸಲು ಕುಟುಂಬ ಅಥವಾ ಸ್ನೇಹಿತರನ್ನು ಸೇರಿಸಿ.",
    familyBondEnergy: "ಬಾಂಧವ್ಯದ ಶಕ್ತಿ",
    familyViewBond: "ಬಾಂಧವ್ಯವನ್ನು ವೀಕ್ಷಿಸಿ",
    familyRunCompatibility: "ಹೊಂದಾಣಿಕೆಯನ್ನು ಚಲಾಯಿಸಿ",
    familyCompatibilityPending: "ವರದಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ",
    familyStatusIncomplete: "ಅಪೂರ್ಣ",
    familyStatusNeedsAttention: "ಗಮನದ ಅಗತ್ಯವಿದೆ",
    familyStatusStable: "ಸ್ಥಿರವಾಗಿದೆ",
    familyStatusNew: "ಹೊಸತು",
    familyInviteBanner: "ನಿಮಗೆ {count} ಕೌಟುಂಬಿಕ ಆಮಂತ್ರಣ ಬಾಕಿ ಇದೆ",
    familyInviteBannerPlural: "ನಿಮಗೆ {count} ಕೌಟುಂಬಿಕ ಆಮಂತ್ರಣಗಳು ಬಾಕಿ ಇವೆ",
    familyInviteReview: "ಪರಿಶೀಲಿಸಿ",
    startChat: "ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ",
    creditSingular: "ಕ್ರೆಡಿಟ್",
    creditPlural: "ಕ್ರೆಡಿಟ್ส์"
  },
  ko: {
    familySubtitle: "가장 가까운 사람들과의 감정적, 카르마적 조화와 궁합 패턴을 확인하세요.",
    familyAddSubtitle: "가족이나 친구를 추가하여 차트와 감정 패턴을 비교해보세요.",
    familyBondEnergy: "유대 에너지",
    familyViewBond: "유대 보기",
    familyRunCompatibility: "궁합 분석",
    familyCompatibilityPending: "분석 대기 중",
    familyStatusIncomplete: "미완성",
    familyStatusNeedsAttention: "주의 필요",
    familyStatusStable: "안정적",
    familyStatusNew: "새로운",
    familyInviteBanner: "{count}개의 가족 초대가 대기 중입니다",
    familyInviteBannerPlural: "{count}개의 가족 초대가 대기 중입니다",
    familyInviteReview: "검토",
    startChat: "채팅 시작",
    creditSingular: "크레딧",
    creditPlural: "크레딧"
  },
  ml: {
    familySubtitle: "നിങ്ങളുടെ ഏറ്റവും അടുത്ത ആളുകളുമായുള്ള വൈകാരികവും പൊരുത്തവുമായ പാറ്റേണുകൾ ട്രാക്ക് ചെയ്യുക.",
    familyAddSubtitle: "ചാർട്ടുകളും വൈകാരിക പാറ്റേണുകളും താരതമ്യം ചെയ്യാൻ കുടുംബാംഗങ്ങളെയോ സുഹൃത്തുക്കളെയോ ചേർക്കുക.",
    familyBondEnergy: "ബന്ധ ഊർജ്ജം",
    familyViewBond: "ബന്ധം കാണുക",
    familyRunCompatibility: "പൊരുത്തം പരിശോധിക്കുക",
    familyCompatibilityPending: "അവലോകനത്തിനായി കാത്തിരിക്കുന്നു",
    familyStatusIncomplete: "അപൂർണ്ണം",
    familyStatusNeedsAttention: "ശ്രദ്ധ ആവശ്യമാണ്",
    familyStatusStable: "സ്ഥിരതയുള്ളത്",
    familyStatusNew: "പുതിയത്",
    familyInviteBanner: "നിങ്ങൾക്ക് {count} കുടുംബ ക്ഷണം ലഭിക്കാനുണ്ട്",
    familyInviteBannerPlural: "നിങ്ങൾക്ക് {count} കുടുംബ ക്ഷണങ്ങൾ ലഭിക്കാനുണ്ട്",
    familyInviteReview: "അവലോകനം ചെയ്യുക",
    startChat: "ചാറ്റ് ആരംഭിക്കുക",
    creditSingular: "ക്രെഡിറ്റ്",
    creditPlural: "ക്രെഡിറ്റുകൾ"
  },
  mr: {
    familySubtitle: "तुमच्या जवळच्या लोकांशी भावनिक, कर्म आणि सुसंगतता पॅटर्नचा मागोवा घ्या.",
    familyAddSubtitle: "पत्रिका आणि भावनिक पॅटर्नची तुलना करण्यासाठी कुटुंब किंवा मित्रांना जोडा.",
    familyBondEnergy: "नातेसंबंध ऊर्जा",
    familyViewBond: "नातेसंबंध पहा",
    familyRunCompatibility: "सुसंगतता तपासा",
    familyCompatibilityPending: "परामर्श प्रलंबित",
    familyStatusIncomplete: "अपूर्ण",
    familyStatusNeedsAttention: "लक्ष देणे आवश्यक",
    familyStatusStable: "स्थिर",
    familyStatusNew: "नवीन",
    familyInviteBanner: "तुमच्याकडे {count} कौटुंबिक आमंत्रण प्रलंबित आहे",
    familyInviteBannerPlural: "तुमच्याकडे {count} कौटुंबिक आमंत्रणे प्रलंबित आहेत",
    familyInviteReview: "पुनरावलोकन",
    startChat: "चॅट सुरू करा",
    creditSingular: "क्रेडिट",
    creditPlural: "क्रेडिट्स"
  },
  pa: {
    familySubtitle: "ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਲੋਕਾਂ ਨਾਲ ਭਾਵਨਾਤਮਮਕ, ਕਰਮ ਅਤੇ ਅਨੁਕੂਲਤਾ ਦੇ ਪੈਟਰਨਾਂ ਨੂੰ ਟਰੈਕ ਕਰੋ।",
    familyAddSubtitle: "ਪੱਤਰੀ ਅਤੇ ਭਾਵਨਾਤਮਕ ਪੈਟਰਨਾਂ ਦੀ ਤੁਲਨਾ ਕਰਨ ਲਈ ਪਰਿਵਾਰ ਜਾਂ ਦੋਸਤਾਂ ਨੂੰ ਜੋੜੋ।",
    familyBondEnergy: "ਰਿਸ਼ਤਾ ਊਰਜਾ",
    familyViewBond: "ਰਿਸ਼ਤਾ ਦੇਖੋ",
    familyRunCompatibility: "ਅਨੁਕੂਲਤਾ ਚਲਾਓ",
    familyCompatibilityPending: "ਸਲਾਹ ਦੀ ਉਡੀਕ",
    familyStatusIncomplete: "ਅਧੂਰਾ",
    familyStatusNeedsAttention: "ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ",
    familyStatusStable: "ਸਥਿਰ",
    familyStatusNew: "ਨਵਾਂ",
    familyInviteBanner: "ਤੁਹਾਡੇ ਕੋਲ {count} ਪਰਿਵਾਰਕ ਸੱਦਾ ਲੰਬਿਤ ਹੈ",
    familyInviteBannerPlural: "ਤੁਹਾਡੇ ਕੋਲ {count} ਪਰਿਵਾਰਕ ਸੱਦੇ ਲੰਬਿਤ ਹਨ",
    familyInviteReview: "ਸਮੀਖਿਆ",
    startChat: "ਚੈਟ ਸ਼ੁਰੂ ਕਰੋ",
    creditSingular: "ਕਰੈਡਿਟ",
    creditPlural: "ਕਰੈਡਿਟ"
  },
  ta: {
    familySubtitle: "உங்களுக்கு நெருக்கமானவர்களுடனான உணர்ச்சி மற்றும் பொருத்த வடிவங்களைக் கண்காணிக்கவும்.",
    familyAddSubtitle: "ஜாதகம் மற்றும் உணர்ச்சி வடிவங்களை ஒப்பிட்டுப் பார்க்க குடும்பத்தினர் அல்லது நண்பர்களைச் சேர்க்கவும்.",
    familyBondEnergy: "உறவு ஆற்றல்",
    familyViewBond: "உறவைப் பார்க்கவும்",
    familyRunCompatibility: "பொருத்தம் பார்க்கவும்",
    familyCompatibilityPending: "ஆலோசனைக்காக காத்திருக்கிறது",
    familyStatusIncomplete: "முழுமையடையாதது",
    familyStatusNeedsAttention: "கவனம் தேவை",
    familyStatusStable: "நிலையானது",
    familyStatusNew: "புதியது",
    familyInviteBanner: "உங்களுக்கு {count} குடும்ப அழைப்பு காத்திருக்கிறது",
    familyInviteBannerPlural: "உங்களுக்கு {count} குடும்ப அழைப்புகள் காத்திருக்கின்றன",
    familyInviteReview: "மதிப்பாய்வு",
    startChat: "அரட்டையைத் தொடங்கவும்",
    creditSingular: "கிரெடிட்",
    creditPlural: "கிரெடிட்கள்"
  },
  te: {
    familySubtitle: "మీకు అత్యంత సన్నిహితులతో భావోద్వేగ, కర్మ మరియు అనుకూలత నమూనాలను ట్రాక్ చేయండి.",
    familyAddSubtitle: "చార్ట్‌లు మరియు భావోద్వేగ నమూనాలను పోల్చడానికి కుటుంబం లేదా స్నేహితులను జోడించండి.",
    familyBondEnergy: "బంధం శక్తి",
    familyViewBond: "బంధం చూడండి",
    familyRunCompatibility: "అనుకూలతను చూడండి",
    familyCompatibilityPending: "నివేదిక కోసం వేచి ఉంది",
    familyStatusIncomplete: "అసంపూర్తి",
    familyStatusNeedsAttention: "శ్రద్ధ అవసరం",
    familyStatusStable: "స్థిరమైనది",
    familyStatusNew: "కొత్తది",
    familyInviteBanner: "మీకు {count} కుటుంబ ఆహ్వానం పెండింగ్‌లో ఉంది",
    familyInviteBannerPlural: "మీకు {count} కుటుంబ ఆహ్వానాలు పెండింగ్‌లో ఉన్నాయి",
    familyInviteReview: "സమీక్షించండి",
    startChat: "చాట్ ప్రారంభించండి",
    creditSingular: "క్రెడిట్",
    creditPlural: "క్రెడిట్స్"
  }
};

// Define translations for today's energy indicators
const energyTranslations = {
  en: {
    bandFavorable: "Favorable",
    bandBalanced: "Balanced",
    bandCaution: "Caution",
    defaultHeadline: "Your current planetary period is on your side - act on the bigger plan now.",
    defaultSubtitle: "This is a powerful window to build momentum, make thoughtful moves, and align with your greater purpose."
  },
  hi: {
    bandFavorable: "अनुकूल",
    bandBalanced: "संतुलित",
    bandCaution: "सतर्क रहें",
    defaultHeadline: "आपकी वर्तमान ग्रहीय अवधि आपके पक्ष में है - अब बड़ी योजना पर काम करें।",
    defaultSubtitle: "यह गति बनाने, विचारशील कदम उठाने और अपने बड़े उद्देश्य के साथ संरेखित करने के लिए एक शक्तिशाली समय है।"
  },
  bn: {
    bandFavorable: "অনুকূল",
    bandBalanced: "ভারসাম্যপূর্ণ",
    bandCaution: "সতর্কতা",
    defaultHeadline: "আপনার বর্তমান গ্রহের দশা আপনার অনুকূলে আছে - এখন বড় পরিকল্পনার উপর কাজ করুন।",
    defaultSubtitle: "গতি তৈরি করতে, চিন্তাশীল পদক্ষেপ নিতে এবং আপনার বৃহত্তর উদ্দেশ্যের সাথে সামঞ্জस्य রাখতে এটি একটি শক্তিশালী সময়।"
  },
  gu: {
    bandFavorable: "અનુકૂળ",
    bandBalanced: "સંતુલિત",
    bandCaution: "સાવધાની",
    defaultHeadline: "તમારી વર્તમાન ગ્રહોની સ્થિતિ તમારી તરફેણમાં છે - હવે મોટી યોજના પર કામ કરો.",
    defaultSubtitle: "આ ગતિ વધારવા, વિચારશીલ પગલાં લેવા અને તમારા ઉચ્ચ હેતુ સાથે સુસંગત થવા માટે એક શક્તિશાલી સમય છે."
  },
  kn: {
    bandFavorable: "ಅನುಕೂಲಕರ",
    bandBalanced: "ಸಮತೋलಿತ",
    bandCaution: "ಎಚ್ಚರಿಕೆ",
    defaultHeadline: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಗ್ರಹಗಳ ಅವಧಿಯು ನಿಮ್ಮ ಪರವಾಗಿದೆ - ಈಗ ದೊಡ್ಡ ಯೋಜನೆಗೆ ಮುಂದಾಗಿ.",
    defaultSubtitle: "ವೇಗವನ್ನು ಹೆಚ್ಚಿಸಲು, ಚಿಂತನಶೀಲ ನಡೆಗಳನ್ನು ಇಡಲು ಮತ್ತು ನಿಮ್ಮ ಹೆಚ್ಚಿನ ಉದ್ದೇಶದೊಂದಿಗೆ ಹೊಂದಿಕೊಳ್ಳಲು ಇದು ಒಂದು ಶಕ್ತಿಶಾಲಿ ಸಮಯ."
  },
  ko: {
    bandFavorable: "우호적",
    bandBalanced: "균형적",
    bandCaution: "주의",
    defaultHeadline: "현재 행성 주기가 귀하의 편입니다 - 지금 큰 계획을 실행하세요.",
    defaultSubtitle: "지금은 기세를 올리고, 신중하게 움직이며, 더 큰 목적에 정렬할 수 있는 강력한 기회입니다."
  },
  ml: {
    bandFavorable: "അനുകൂലം",
    bandBalanced: "സന്തുലിതം",
    bandCaution: "ജാഗ്രത",
    defaultHeadline: "നിങ്ങളുടെ നിലവിലെ ഗ്രഹങ്ങളുടെ സമയം നിങ്ങൾക്ക് അനുകൂലമാണ് - ഇപ്പോൾ വലിയ പദ്ധതിയിൽ പ്രവർത്തിക്കുക.",
    defaultSubtitle: "വേഗത കൈവരിക്കാനും ചിന്തനീയമായ ചുവടുകൾ വെക്കാനും നിങ്ങളുടെ വലിയ ലക്ഷ്യത്തിലേക്ക് നീങ്ങാനും അനുയോജ്യമായ സമയമാണിത്."
  },
  mr: {
    bandFavorable: "अनुकूल",
    bandBalanced: "संतुलित",
    bandCaution: "सावधगिरी",
    defaultHeadline: "तुमची सध्याची ग्रहांची दशा तुमच्या बाजूने आहे - आता मोठ्या योजनेवर काम करा.",
    defaultSubtitle: "हा वेग वाढवण्याचा, विचारपूर्वक पावले उचलण्याचा आणि तुमच्या मोठ्या ध्येयाशी जुळवून घेण्याचा एक शक्तिशाली वेळ आहे."
  },
  pa: {
    bandFavorable: "ਅਨੁਕੂਲ",
    bandBalanced: "ਸੰਤੁਲਿਤ",
    bandCaution: "ਸਾਵਧਾਨ",
    defaultHeadline: "ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਗ੍ਰਹਿ ਦਸ਼ਾ ਤੁਹਾਡੇ ਪੱਖ ਵਿੱਚ ਹੈ - ਹੁਣ ਵੱਡੀ ਯੋਜਨਾ 'ਤੇ ਕੰਮ ਕਰੋ।",
    defaultSubtitle: "ਇਹ ਗਤੀ ਬਣਾਉਣ, ਸੋਚ ਸਮਝ ਕੇ ਕਦਮ ਚੁੱਕਣ ਅਤੇ ਆਪਣੇ ਵੱਡੇ ਉਦੇਸ਼ ਨਾਲ ਇਕਸਾਰ ਹੋਣ ਦਾ ਇੱਕ ਸ਼ਕਤੀਸ਼ਾਲੀ ਸਮਾਂ ਹੈ।"
  },
  ta: {
    bandFavorable: "சாதகமானது",
    bandBalanced: "சீரானது",
    bandCaution: "எச்சரிக்கை",
    defaultHeadline: "உங்கள் தற்போதைய கிரக காலம் உங்களுக்கு சாதகமாக உள்ளது - இப்போது பெரிய திட்டத்தில் செயல்படுங்கள்.",
    defaultSubtitle: "வேகத்தை உருவாக்கவும், சிந்தித்து செயல்படவும், உங்கள் பெரிய குறிக்கோளுடன் இணையவும் இது ஒரு சிறந்த நேரமாகும்."
  },
  te: {
    bandFavorable: "అనుకూలమైనది",
    bandBalanced: "సమతుల్యమైనది",
    bandCaution: "హెచ్చరిక",
    defaultHeadline: "మీ ప్రస్తుత గ్రహాల కాలం మీకు అనుకూలంగా ఉంది - ఇప్పుడే ప్రణాళికను అమలు చేయండి.",
    defaultSubtitle: "వేగాన్ని పెంచడానికి, ఆలోచనాత్మక అడుగులు వేయడానికి మరియు మీ గొప్ప లక్ష్యంతో సమలేఖనం కావడానికి ఇది ఒక శక్తివంతమైన సమయం."
  }
};

const locales = ['en', 'hi', 'bn', 'gu', 'kn', 'ko', 'ml', 'mr', 'pa', 'ta', 'te'];

locales.forEach(loc => {
  const filePath = path.join(localesDir, `${loc}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);

    // 1. Inject translations into "dashboard" block
    if (!json.dashboard) {
      json.dashboard = {};
    }
    const localDashboard = dashboardTranslations[loc] || dashboardTranslations['en'];
    Object.keys(localDashboard).forEach(key => {
      json.dashboard[key] = localDashboard[key];
    });

    // 2. Inject today's energy band descriptors and default fallbacks into "newDashboard.todaysEnergy" block
    if (!json.newDashboard) {
      json.newDashboard = {};
    }
    if (!json.newDashboard.todaysEnergy) {
      json.newDashboard.todaysEnergy = {};
    }
    const localEnergy = energyTranslations[loc] || energyTranslations['en'];
    Object.keys(localEnergy).forEach(key => {
      json.newDashboard.todaysEnergy[key] = localEnergy[key];
    });

    // Write formatted JSON back to file
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`[Dashboard i18n] Successfully updated ${loc}.json`);
  } catch (err) {
    console.error(`Error updating ${loc}.json:`, err);
  }
});
