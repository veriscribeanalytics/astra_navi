const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// Define translations for the "paywall" block
const paywallTranslations = {
  en: {
    credits: "Credits",
    creditsRequired: "credits required",
    creditSingle: "credit",
    creditPlural: "credits",
    required: "Required",
    creditsRequiredLabel: "credits required",
    currentTier: "Current tier: {tier}",
    viewPlansUpgrade: "View Plans & Upgrade",
    viewPlans: "View Plans",
    products: {
      pro_monthly: "Pro Monthly",
      credit_pack_10: "10 Credits Pack"
    },
    features: {
      chat_message: {
        title: "AI Chat Credits",
        description: "Consult our specialized Vedic AI astrologers. Each message uses credit."
      },
      full_daily_horoscope: {
        title: "Full Daily Horoscope",
        description: "Get personalized area insights, transit overlays, and daily alerts based on your chart."
      },
      tomorrow_horoscope: {
        title: "Tomorrow's Horoscope",
        description: "View tomorrow's cosmic forecast and plan ahead."
      },
      guided_consult: {
        title: "Guided Sessions",
        description: "Personalized, deep step-by-step life consultations."
      },
      match_report: {
        title: "Compatibility Report",
        description: "Unlock full 36-point Guna Milan, partner sync, and relationship harmony analysis."
      },
      kundli_premium: {
        title: "Premium Kundli",
        description: "Unlock advanced planetary period details, Ashtakavarga, transits, and key themes."
      },
      family_compatibility: {
        title: "Family Compatibility",
        description: "Track emotional, karmic and compatibility patterns with your family and friends."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "Premium Dasha Analysis",
        description: "Dasha timing analysis requires a premium subscription."
      },
      ashtakavargaanalysis: {
        title: "Ashtakavarga Analysis",
        description: "Unlock Ashtakavarga binding scores with a Pro plan."
      },
      planetstrengthranking: {
        title: "Planet Strength Ranking",
        description: "Unlock detailed planet strength rankings with a Pro plan."
      },
      currenttransits: {
        title: "Current Transits",
        description: "Unlock current planetary transit analysis with a Pro plan."
      },
      keylifethemes: {
        title: "Key Life Themes",
        description: "Unlock key life theme insights with a Pro plan."
      }
    }
  },
  hi: {
    credits: "क्रेडिट",
    creditsRequired: "क्रेडिट आवश्यक",
    creditSingle: "क्रेडिट",
    creditPlural: "क्रेडिट",
    required: "आवश्यक",
    creditsRequiredLabel: "क्रेडिट आवश्यक",
    currentTier: "वर्तमान टियर: {tier}",
    viewPlansUpgrade: "योजनाएं देखें और अपग्रेड करें",
    viewPlans: "योजनाएं देखें",
    products: {
      pro_monthly: "प्रो मासिक",
      credit_pack_10: "10 क्रेडिट पैक"
    },
    features: {
      chat_message: {
        title: "AI चैट क्रेडिट",
        description: "हमारे विशेष वैदिक AI ज्योतिषियों से परामर्श लें। प्रत्येक संदेश में क्रेडिट का उपयोग होता है।"
      },
      full_daily_horoscope: {
        title: "पूर्ण दैनिक राशिफल",
        description: "अपनी कुंडली के आधार पर व्यक्तिगत क्षेत्र अंतर्दृष्टि, गोचर, और दैनिक अलर्ट प्राप्त करें।"
      },
      tomorrow_horoscope: {
        title: "कल का राशिफल",
        description: "कल का ब्रह्मांडीय पूर्वानुमान देखें और आगे की योजना बनाएं।"
      },
      guided_consult: {
        title: "मार्गदर्शित सत्र",
        description: "व्यक्तिगत, गहन चरण-दर-चरण जीवन परामर्श।"
      },
      match_report: {
        title: "अनुकूलता रिपोर्ट",
        description: "पूर्ण 36-बिंदु गुण मिलान, साथी सिंक और संबंध सद्भाव विश्लेषण अनलॉक करें।"
      },
      kundli_premium: {
        title: "प्रीमियम कुंडली",
        description: "उन्नत ग्रहीय अवधि विवरण, अष्टकवर्ग, गोचर और प्रमुख विषयों को अनलॉक करें।"
      },
      family_compatibility: {
        title: "पारिवारिक अनुकूलता",
        description: "अपने परिवार और दोस्तों के साथ भावनात्मक, कर्म और अनुकूलता पैटर्न को ट्रैक करें।"
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "प्रीमियम दशा विश्लेषण",
        description: "दशा समय विश्लेषण के लिए प्रीमियम सदस्यता की आवश्यकता है।"
      },
      ashtakavargaanalysis: {
        title: "अष्टकवर्ग विश्लेषण",
        description: "प्रो योजना के साथ अष्टकवर्ग बंधन स्कोर अनलॉक करें।"
      },
      planetstrengthranking: {
        title: "ग्रह शक्ति रैंकिंग",
        description: "प्रो योजना के साथ विस्तृत ग्रह शक्ति रैंकिंग अनलॉक करें।"
      },
      currenttransits: {
        title: "वर्तमान गोचर",
        description: "प्रो योजना के साथ वर्तमान ग्रहीय गोचर विश्लेषण अनलॉक करें।"
      },
      keylifethemes: {
        title: "प्रमुख जीवन विषय",
        description: "प्रो योजना के साथ प्रमुख जीवन विषय अंतर्दृष्टि अनलॉक करें।"
      }
    }
  },
  bn: {
    credits: "ক্রেডিট",
    creditsRequired: "ক্রেডিট প্রয়োজন",
    creditSingle: "ক্রেডিট",
    creditPlural: "ক্রেডিট",
    required: "প্রয়োজন",
    creditsRequiredLabel: "ক্রেডিট প্রয়োজন",
    currentTier: "বর্তমান স্তর: {tier}",
    viewPlansUpgrade: "পরিকল্পনা দেখুন ও আপগ্রেড করুন",
    viewPlans: "পরিকল্পনা দেখুন",
    products: {
      pro_monthly: "প্রো মাসিক",
      credit_pack_10: "১০ ক্রেডিট প্যাক"
    },
    features: {
      chat_message: {
        title: "AI চ্যাট ক্রেডিট",
        description: "আমাদের বিশেষ বৈদিক AI জ্যোতিষীদের সাথে পরামর্শ করুন। প্রতিটি বার্তার জন্য ক্রেডিট ব্যবহৃত হয়।"
      },
      full_daily_horoscope: {
        title: "সম্পূর্ণ দৈনিক রাশিফল",
        description: "আপনার কুন্ডলীর উপর ভিত্তি করে ব্যক্তিগতকৃত ক্ষেত্র বিশ্লেষণ, গোচর এবং দৈনিক অ্যালার্ট পান।"
      },
      tomorrow_horoscope: {
        title: "আগামীকালের রাশিফল",
        description: "আগামীকালের মহাজাগতিক পূর্বাভাস দেখুন এবং আগে থেকেই পরিকল্পনা করুন।"
      },
      guided_consult: {
        title: "নির্দেশিত সেশন",
        description: "ব্যক্তিগতকৃত, গভীর ধাপে ধাপে জীবন পরামর্শ।"
      },
      match_report: {
        title: "সামঞ্জস্য রিপোর্ট",
        description: "সম্পূর্ণ ৩৬-পয়েন্ট গুণ মিলন, পার্টনার সিঙ্ক এবং সম্পর্কের সামঞ্জস্য বিশ্লেষণ আনলক করুন।"
      },
      kundli_premium: {
        title: "প্রিমিয়াম কুন্ডলী",
        description: "উন্নত গ্রহের সময়কালের বিবরণ, অষ্টকবর্গ, গোচর এবং মূল থিমগুলি আনলক করুন।"
      },
      family_compatibility: {
        title: "পারিবারিক সামঞ্জস্য",
        description: "আপনার পরিবার এবং বন্ধুদের সাথে মানসিক, কর্মফল এবং সামঞ্জস্যের ধরণগুলি ট্র্যাক করুন।"
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "প্রিমিয়াম দশা বিশ্লেষণ",
        description: "দশা সময়ের বিশ্লেষণের জন্য একটি প্রিমিয়াম সাবস্ক্রিপশন প্রয়োজন।"
      },
      ashtakavargaanalysis: {
        title: "অষ্টকবর্গ বিশ্লেষণ",
        description: "একটি প্রো পরিকল্পনার সাথে অষ্টকবর্গের স্কোর আনলক করুন।"
      },
      planetstrengthranking: {
        title: "গ্রহের শক্তি র‍্যাঙ্কিং",
        description: "একটি প্রো পরিকল্পনার সাথে বিস্তারিত গ্রহের শক্তির র‍্যাঙ্কিং আনলক করুন।"
      },
      currenttransits: {
        title: "বর্তমান গোচর",
        description: "একটি প্রো পরিকল্পনার সাথে বর্তমান গ্রহের গোচর বিশ্লেষণ আনলক করুন।"
      },
      keylifethemes: {
        title: "মূল জীবন থিম",
        description: "একটি প্রো পরিকল্পনার সাথে মূল জীবনের থিমের অন্তর্দৃষ্টি আনলক করুন।"
      }
    }
  },
  gu: {
    credits: "ક્રેડિટ્સ",
    creditsRequired: "ક્રેડિટ્સ જરૂરી",
    creditSingle: "ક્રેડિટ",
    creditPlural: "ક્રેડિટ્સ",
    required: "જરૂરી",
    creditsRequiredLabel: "ક્રેડિટ્સ જરૂરી",
    currentTier: "વર્તમાન સ્તર: {tier}",
    viewPlansUpgrade: "યોજનાઓ જુઓ અને અપગ્રેડ કરો",
    viewPlans: "યોજનાઓ જુઓ",
    products: {
      pro_monthly: "પ્રો માસિક",
      credit_pack_10: "૧૦ ક્રેડિટ્સ પેક"
    },
    features: {
      chat_message: {
        title: "AI ચેટ ક્રેડિટ્સ",
        description: "અમારા વિશિષ્ટ વૈદિક AI જ્યોતિષીઓની સલાહ લો. દરેક સંદેશ ક્રેડિટનો ઉપયોગ કરે છે."
      },
      full_daily_horoscope: {
        title: "સંપૂર્ણ દૈનિક રાશિફળ",
        description: "તમારી કુંડળીના આધારે વ્યક્તિગત ક્ષેત્રની આંતરદૃષ્ટિ, ગોચર અને દૈનિક ચેતવણીઓ મેળવો."
      },
      tomorrow_horoscope: {
        title: "આવતીકાલનું રાશિફળ",
        description: "આવતીકાલની બ્રહ્માંડિય આગાહી જુઓ અને આગળનું આયોજન કરો."
      },
      guided_consult: {
        title: "માર્ગદર્શિત સત્રો",
        description: "વ્યક્તિગત, ઊંડાણપૂર્વક પગલું-દર-પગલું જીવન પરામર્શ."
      },
      match_report: {
        title: "અનુકૂળતા અહેવાલ",
        description: "સંપૂર્ણ ૩૬-પોઇન્ટ ગુણ મિલન, પાર્ટનર સિંક અને સંબંધ સંવાદિતા વિશ્લેષણ અનલૉક કરો."
      },
      kundli_premium: {
        title: "પ્રીમિયમ કુંડળી",
        description: "અદ્યતન ગ્રહોની સમયગાળાની વિગતો, અષ્ટકવર્ગ, ગોચર અને મુખ્ય વિષયોને અનલૉક કરો."
      },
      family_compatibility: {
        title: "કૌટુંબિક અનુકૂળતા",
        description: "તમારા પરિવાર અને મિત્રો સાથે ભાવનાત્મક, કર્મ અને અનુકૂળતા પેટર્નને ટ્રૅક કરો."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "પ્રીમિયમ દશા વિશ્લેષણ",
        description: "દશા સમય વિશ્લેષણ માટે પ્રીમિયમ સબ્સ્ક્રિપ્શનની જરૂર છે."
      },
      ashtakavargaanalysis: {
        title: "અષ્ટકવર્ગ વિશ્લેષણ",
        description: "પ્રો પ્લાન સાથે અષ્ટકવર્ગ સ્કોર્સ અનલોક કરો."
      },
      planetstrengthranking: {
        title: "ગ્રહ શક્તિ રેન્કિંગ",
        description: "પ્રો પ્લાન સાથે વિગતવાર ગ્રહ શક્તિ રેન્કિંગ અનલોક કરો."
      },
      currenttransits: {
        title: "વર્તમાન ગોચર",
        description: "પ્રો પ્લાન સાથે વર્તમાન ગ્રહીય ગોચર વિશ્લેષણ અનલોક કરો."
      },
      keylifethemes: {
        title: "મુખ્ય જીવન વિષયો",
        description: "પ્રો પ્લાન સાથે મુખ્ય જીવન વિષયની આંતરદૃષ્ટિ અનલોક કરો."
      }
    }
  },
  kn: {
    credits: "ಕ್ರೆಡಿಟ್ಸ್",
    creditsRequired: "ಕ್ರೆಡಿಟ್ಸ್ ಅಗತ್ಯವಿದೆ",
    creditSingle: "ಕ್ರೆಡಿಟ್",
    creditPlural: "ಕ್ರೆಡಿಟ್ಸ್",
    required: "ಅಗತ್ಯವಿದೆ",
    creditsRequiredLabel: "ಕ್ರೆಡಿಟ್ಸ್ ಅಗತ್ಯವಿದೆ",
    currentTier: "ಪ್ರಸ್ತುತ ಶ್ರೇಣಿ: {tier}",
    viewPlansUpgrade: "ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಅಪ್‌ಗ್ರೇಡ್ ಮಾಡಿ",
    viewPlans: "ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    products: {
      pro_monthly: "ಪ್ರೊ ಮಾಸಿಕ",
      credit_pack_10: "೧೦ ಕ್ರೆಡಿಟ್ಸ್ ಪ್ಯಾಕ್"
    },
    features: {
      chat_message: {
        title: "AI ಚಾಟ್ ಕ್ರೆಡಿಟ್ಸ್",
        description: "ನಮ್ಮ ವಿಶೇಷ ವೈದಿಕ AI ಜ್ಯೋತಿಷಿಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ. ಪ್ರತಿಯೊಂದು ಸಂದೇಶಕ್ಕೂ ಕ್ರೆಡಿಟ್ ಬಳಸಲಾಗುತ್ತದೆ."
      },
      full_daily_horoscope: {
        title: "ಸಂಪೂರ್ಣ ದೈನಂದಿನ ರಾಶಿಫಲ",
        description: "ನಿಮ್ಮ ಜಾತಕದ ಆಧಾರದ ಮೇಲೆ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಕ್ಷೇತ್ರ ಒಳನೋಟಗಳು, ಗೋಚಾರ ಮತ್ತು ದೈನಂದಿನ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಪಡೆಯಿರಿ."
      },
      tomorrow_horoscope: {
        title: "ನಾಳೆಯ ರಾಶಿಫಲ",
        description: "ನಾಳೆಯ ಬ್ರಹ್ಮಾಂಡದ ಮುನ್ಸೂಚನೆಯನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಮುಂಚಿತವಾಗಿ ಯೋಜನೆ ರೂಪಿಸಿ."
      },
      guided_consult: {
        title: "ಮಾರ್ಗದರ್ಶಿತ ಅವಧಿಗಳು",
        description: "ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ, ಆಳವಾದ ಹಂತ-ಹಂತದ ಜೀವನ ಸಮಾಲೋಚನೆ."
      },
      match_report: {
        title: "ಹೊಂದಾಣಿಕೆ ವರದಿ",
        description: "ಸಂಪೂರ್ಣ ೩೬-ಅಂಶಗಳ ಗುಣ ಮಿಲನ, ಪಾಲುದಾರ ಸಿಂಕ್ ಮತ್ತು ಸಂಬಂಧದ ಸಾಮರಸ್ಯದ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ."
      },
      kundli_premium: {
        title: "ಪ್ರೀಮಿಯಂ ಜಾತಕ",
        description: "ಸುಧಾರಿತ ಗ್ರಹಗಳ ಅವಧಿಯ ವಿವರಗಳು, ಅಷ್ಟಕವರ್ಗ, ಗೋಚಾರ ಮತ್ತು ಪ್ರಮುಖ ವಿಷಯಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ."
      },
      family_compatibility: {
        title: "ಕೌಟುಂಬಿಕ ಹೊಂದಾಣಿಕೆ",
        description: "ನಿಮ್ಮ ಕುಟುಂಬ ಮತ್ತು ಸ್ನೇಹಿತರೊಂದಿಗೆ ಭಾವನಾತ್ಮಕ, ಕರ್ಮ ಮತ್ತು ಹೊಂದಾಣಿಕೆಯ ಮಾದರಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "ಪ್ರೀಮಿಯಂ ದಶಾ ವಿಶ್ಲೇಷಣೆ",
        description: "ದಶಾ ಸಮಯದ ವಿಶ್ಲೇಷಣೆಗೆ ಪ್ರೀಮಿಯಂ ಚಂದಾದಾರಿಕೆ ಅಗತ್ಯವಿದೆ."
      },
      ashtakavargaanalysis: {
        title: "ಅಷ್ಟಕವರ್ಗ ವಿಶ್ಲೇಷಣೆ",
        description: "ಪ್ರೊ ಯೋಜನೆಯೊಂದಿಗೆ ಅಷ್ಟಕವರ್ಗ ಸ್ಕೋರ್‌ಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ."
      },
      planetstrengthranking: {
        title: "ಗ್ರಹಗಳ ಬಲ ಶ್ರೇಯಾಂಕ",
        description: "ಪ್ರೊ ಯೋಜನೆಯೊಂದಿಗೆ ವಿವರವಾದ ಗ್ರಹಗಳ ಬಲ ಶ್ರೇಯಾಂಕಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ."
      },
      currenttransits: {
        title: "ಪ್ರಸ್ತುತ ಗೋಚಾರ",
        description: "ಪ್ರೊ ಯೋಜನೆಯೊಂದಿಗೆ ಪ್ರಸ್ತುತ ಗ್ರಹಗಳ ಗೋಚಾರ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ."
      },
      keylifethemes: {
        title: "ಪ್ರಮುಖ ಜೀವನ ವಿಷಯಗಳು",
        description: "ಪ್ರೊ ಯೋಜನೆಯೊಂದಿಗೆ ಪ್ರಮುಖ ಜೀವನ ವಿಷಯದ ಒಳನೋಟಗಳನ್ನು ಅನ್ಲಾಕ್ ಮಾಡಿ."
      }
    }
  },
  ko: {
    credits: "크레딧",
    creditsRequired: "크레딧 필요",
    creditSingle: "크레딧",
    creditPlural: "크레딧",
    required: "필수",
    creditsRequiredLabel: "크레딧 필요",
    currentTier: "현재 등급: {tier}",
    viewPlansUpgrade: "요금제 보기 및 업그레이드",
    viewPlans: "요금제 보기",
    products: {
      pro_monthly: "Pro 월간 요금제",
      credit_pack_10: "10 크레딧 팩"
    },
    features: {
      chat_message: {
        title: "AI 채팅 크레딧",
        description: "전문 베딕 AI 점성술사와 상담하세요. 메시지당 1크레딧이 사용됩니다."
      },
      full_daily_horoscope: {
        title: "전체 일일 운세",
        description: "나의 차트를 기반으로 한 개인 맞춤형 생활 영역 분석, 행성 이동 및 일일 알림을 받아보세요."
      },
      tomorrow_horoscope: {
        title: "내일의 운세",
        description: "내일의 우주 흐름을 미리 확인하고 하루를 계획하세요."
      },
      guided_consult: {
        title: "가이드 세션",
        description: "개인 맞춤형 심층 1:1 인생 컨설팅을 경험하세요."
      },
      match_report: {
        title: "궁합 분석 리포트",
        description: "상세한 36점 구나 밀란, 파트너 동기화 및 관계 조화 분석을 확인하세요."
      },
      kundli_premium: {
        title: "프리미엄 쿤들리",
        description: "고급 행성 주기 분석, 아쉬타카바르가, 실시간 트랜싯 및 주요 테마를 해제하세요."
      },
      family_compatibility: {
        title: "가족 궁합",
        description: "가족 및 친구들과의 정서적, 카르마적 조화와 궁합 패턴을 확인하세요."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "프리미엄 다샤 분석",
        description: "상세한 다샤 시기 분석은 프리미엄 요금제가 필요합니다."
      },
      ashtakavargaanalysis: {
        title: "아쉬타카바르가 분석",
        description: "Pro 요금제로 아쉬타카바르가 상세 점수를 확인하세요."
      },
      planetstrengthranking: {
        title: "행성 강도 랭킹",
        description: "Pro 요금제로 행성별 정밀한 강도 분석을 해제하세요."
      },
      currenttransits: {
        title: "현재 행성 이동",
        description: "Pro 요금제로 현재 실시간 행성 이동 분석을 확인하세요."
      },
      keylifethemes: {
        title: "주요 인생 테마",
        description: "Pro 요금제로 주요 인생 테마와 통찰을 해제하세요."
      }
    }
  },
  ml: {
    credits: "ക്രെഡിറ്റുകൾ",
    creditsRequired: "ക്രെഡിറ്റുകൾ ആവശ്യമുണ്ട്",
    creditSingle: "ക്രെഡിറ്റ്",
    creditPlural: "ക്രെഡിറ്റുകൾ",
    required: "ആവശ്യമുണ്ട്",
    creditsRequiredLabel: "ക്രെഡിറ്റുകൾ ആവശ്യമുണ്ട്",
    currentTier: "നിലവിലെ തലം: {tier}",
    viewPlansUpgrade: "പ്ലാനുകൾ കാണുക & അപ്ഗ്രേഡ് ചെയ്യുക",
    viewPlans: "പ്ലാനുകൾ കാണുക",
    products: {
      pro_monthly: "പ്രോ പ്രതിമാസം",
      credit_pack_10: "10 ക്രെഡിറ്റുകളുടെ പാക്ക്"
    },
    features: {
      chat_message: {
        title: "AI ചാറ്റ് ക്രെഡിറ്റുകൾ",
        description: "ഞങ്ങളുടെ പ്രത്യേക വൈദിക AI ജ്യോതിഷികളുമായി ആലോചിക്കുക. ഓരോ സന്ദേശത്തിനും ക്രെഡിറ്റ് ആവശ്യമാണ്."
      },
      full_daily_horoscope: {
        title: "പൂർണ്ണ പ്രതിദിന രാശിഫലം",
        description: "നിങ്ങളുടെ ജാതകത്തെ അടിസ്ഥാനമാക്കി വ്യക്തിഗതമാക്കിയ മേഖല ഉൾക്കാഴ്ചകളും പ്രതിദിന അലേർട്ടുകളും നേടുക."
      },
      tomorrow_horoscope: {
        title: "നാളത്തെ രാശിഫലം",
        description: "നാളത്തെ പ്രവചനങ്ങൾ കാണുകയും മുൻകൂട്ടി പ്ലാൻ ചെയ്യുകയും ചെയ്യുക."
      },
      guided_consult: {
        title: "മാർഗ്ഗനിർദ്ദേശ സെഷനുകൾ",
        description: "വ്യക്തിഗതമാക്കിയ, ആഴത്തിലുള്ള ഘട്ടം ഘട്ടമായുള്ള ജീവിത കൗൺസിലിംഗ്."
      },
      match_report: {
        title: "പൊരുത്ത റിപ്പോർട്ട്",
        description: "പൂർണ്ണ 36-പോയിന്റ് ഗുണനില പരിശോധനയും ബന്ധങ്ങളിലെ പൊരുത്ത വിശകലനവും അൺലോക്ക് ചെയ്യുക."
      },
      kundli_premium: {
        title: "പ്രീമിയം ജാതകം",
        description: "വിപുലമായ ഗ്രഹ കാലയളവ് വിവരങ്ങൾ, അഷ്ടകവർഗ്ഗം, ഗോചാരം എന്നിവ അൺലോക്ക് ചെയ്യുക."
      },
      family_compatibility: {
        title: "കുടുംബ പൊരുത്തം",
        description: "കുടുംബാംഗങ്ങളുമായും സുഹൃത്തുക്കളുമായും ഉള്ള വൈകാരികവും പൊരുത്തവുമായ പാറ്റേണുകൾ ട്രാക്ക് ചെയ്യുക."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "പ്രീമിയം ദശാ വിശകലനം",
        description: "ദശാ സമയ വിശകലനത്തിന് ഒരു പ്രീമിയം സബ്‌സ്‌ക്രിപ്ഷൻ ആവശ്യമാണ്."
      },
      ashtakavargaanalysis: {
        title: "അഷ്ടകവർഗ്ഗ വിശകലനം",
        description: "ഒരു പ്രോ പ്ലാൻ ഉപയോഗിച്ച് അഷ്ടകവർഗ്ഗ സ്കോറുകൾ അൺലോക്ക് ചെയ്യുക."
      },
      planetstrengthranking: {
        title: "ഗ്രഹ ബല റാങ്കിംഗ്",
        description: "ഒരു പ്രോ പ്ലാൻ ഉപയോഗിച്ച് വിശദമായ ഗ്രഹ ബല റാങ്കിംഗ് അൺലോക്ക് ചെയ്യുക."
      },
      currenttransits: {
        title: "നിലവിലെ ഗോചാരം",
        description: "ഒരു പ്രോ പ്ലാൻ ഉപയോഗിച്ച് നിലവിലെ ഗ്രഹ ഗോചാര വിശകലനം അൺലോക്ക് ചെയ്യുക."
      },
      keylifethemes: {
        title: "പ്രധാന ജീവിത തീമുകൾ",
        description: "ഒരു പ്രോ പ്ലാൻ ഉപയോഗിച്ച് പ്രധാന ജീവിത തീം ഉൾക്കാഴ്ചകൾ അൺലോക്ക് ചെയ്യുക."
      }
    }
  },
  mr: {
    credits: "क्रेडिट्स",
    creditsRequired: "क्रेडिट्स आवश्यक",
    creditSingle: "क्रेडिट",
    creditPlural: "क्रेडिट्स",
    required: "आवश्यक",
    creditsRequiredLabel: "क्रेडिट्स आवश्यक",
    currentTier: "सध्याची श्रेणी: {tier}",
    viewPlansUpgrade: "योजना पहा आणि अपग्रेड करा",
    viewPlans: "योजना पहा",
    products: {
      pro_monthly: "प्रो मासिक",
      credit_pack_10: "१० क्रेडिट्स पॅक"
    },
    features: {
      chat_message: {
        title: "AI चॅट क्रेडिट्स",
        description: "आमच्या विशेष वैदिक AI ज्योतिष्यांचा सल्ला घ्या. प्रत्येक संदेशासाठी क्रेडिट वापरले जाते."
      },
      full_daily_horoscope: {
        title: "संपूर्ण दैनिक राशीभविष्य",
        description: "तुमच्या पत्रिकेवर आधारित वैयक्तिकृत क्षेत्र अंतर्दृष्टी, गोचर आणि दैनिक सूचना मिळवा."
      },
      tomorrow_horoscope: {
        title: "उद्याचे राशीभविष्य",
        description: "उद्याचा ब्रह्मांडीय अंदाज पहा आणि आधीच नियोजन करा."
      },
      guided_consult: {
        title: "मार्गदर्शित सत्र",
        description: "वैयक्तिकृत, सखोल टप्प्याटप्प्याने जीवन सल्ला."
      },
      match_report: {
        title: "सुसंगतता अहवाल",
        description: "संपूर्ण ३६-गुण मिलन, जोडीदार सिंक आणि नातेसंबंध सुसंवाद विश्लेषण अनलॉक करा."
      },
      kundli_premium: {
        title: "प्रीमियम कुंडली",
        description: "प्रगत ग्रहांच्या कालावधीचे तपशील, अष्टकवर्ग, गोचर आणि मुख्य विषय अनलॉक करा."
      },
      family_compatibility: {
        title: "कौटुंबिक सुसंगतता",
        description: "तुमच्या कुटुंब आणि मित्रांसह भावनिक, कर्म आणि सुसंगतता पॅटर्नचा मागोवा घ्या."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "प्रीमियम दशा विश्लेषण",
        description: "दशा वेळेच्या विश्लेषणासाठी प्रीमियम सदस्यत्व आवश्यक आहे."
      },
      ashtakavargaanalysis: {
        title: "अष्टकवर्ग विश्लेषण",
        description: "प्रो योजनेसह अष्टकवर्ग बंधनकारक गुण अनलॉक करा."
      },
      planetstrengthranking: {
        title: "ग्रह बल रँकिंग",
        description: "प्रो योजनेसह तपशीलवार ग्रह बल रँकिंग अनलॉक करा."
      },
      currenttransits: {
        title: "सध्याचे गोचर",
        description: "प्रो योजनेसह सध्याचे ग्रहांचे गोचर विश्लेषण अनलॉक करा."
      },
      keylifethemes: {
        title: "मुख्य जीवन विषय",
        description: "प्रो योजनेसह मुख्य जीवन विषयाचे अंतर्दृष्टी अनलॉक करा."
      }
    }
  },
  pa: {
    credits: "ਕਰੈਡਿਟ",
    creditsRequired: "ਕਰੈਡਿਟ ਲੋੜੀਂਦੇ ਹਨ",
    creditSingle: "ਕਰੈਡਿਟ",
    creditPlural: "ਕਰੈਡਿਟ",
    required: "ਲੋੜੀਂਦਾ",
    creditsRequiredLabel: "ਕਰੈਡਿਟ ਲੋੜੀਂਦੇ ਹਨ",
    currentTier: "ਮੌਜੂਦਾ ਟਾਇਰ: {tier}",
    viewPlansUpgrade: "ਯੋਜਨਾਵਾਂ ਦੇਖੋ ਅਤੇ ਅੱਪਗ੍ਰੇਡ ਕਰੋ",
    viewPlans: "ਯੋਜਨਾਵਾਂ ਦੇਖੋ",
    products: {
      pro_monthly: "ਪ੍ਰੋ ਮਹੀਨਾਵਾਰ",
      credit_pack_10: "੧੦ ਕਰੈਡਿਟ ਪੈਕ"
    },
    features: {
      chat_message: {
        title: "AI ਚੈਟ ਕਰੈਡਿਟ",
        description: "ਸਾਡੇ ਵਿਸ਼ੇਸ਼ ਵੈਦਿਕ AI ਜੋਤਸ਼ੀਆਂ ਨਾਲ ਸਲਾਹ ਕਰੋ। ਹਰ ਸੁਨੇਹਾ ਕਰੈਡਿਟ ਦੀ ਵਰਤੋਂ ਕਰਦਾ ਹੈ।"
      },
      full_daily_horoscope: {
        title: "ਪੂਰਾ ਰੋਜ਼ਾਨਾ ਰਾਸ਼ੀਫਲ",
        description: "ਆਪਣੀ ਕੁੰਡਲੀ ਦੇ ਆਧਾਰ 'ਤੇ ਵਿਅਕਤੀਗਤ ਖੇਤਰ ਦੀਆਂ ਸੂਝਾਂ, ਗੋਚਰ ਅਤੇ ਰੋਜ਼ਾਨਾ ਅਲਰਟ ਪ੍ਰਾਪਤ ਕਰੋ।"
      },
      tomorrow_horoscope: {
        title: "ਕੱਲ੍ਹ ਦਾ ਰਾਸ਼ੀਫਲ",
        description: "ਕੱਲ੍ਹ ਦੀ ਬ੍ਰਹਿਮੰਡੀ ਭਵਿੱਖਬਾਣੀ ਦੇਖੋ ਅਤੇ ਅੱਗੇ ਦੀ ਯੋਜਨਾ ਬਣਾਓ।"
      },
      guided_consult: {
        title: "ਨਿਰਦੇਸ਼ਿਤ ਸੈਸ਼ਨ",
        description: "ਵਿਅਕਤੀਗਤ, ਡੂੰਘੀ ਕਦਮ-ਦਰ-ਕਦਮ ਜੀਵਨ ਸਲਾਹ।"
      },
      match_report: {
        title: "ਅਨੁਕੂਲਤਾ ਰਿਪੋਰਟ",
        description: "ਪੂਰਾ ੩੬-ਪੁਆਇੰਟ ਗੁਣ ਮਿਲਾਨ, ਸਾਥੀ ਸਿੰਕ ਅਤੇ ਰਿਸ਼ਤੇ ਦੀ ਇਕਸੁਰਤਾ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।"
      },
      kundli_premium: {
        title: "ਪ੍ਰੀਮੀਅਮ ਕੁੰਡਲੀ",
        description: "ਉੱਨਤ ਗ੍ਰਹਿ ਦੌਰ ਦੇ ਵੇਰਵੇ, ਅਸ਼ਟਕਵਰਗ, ਗੋਚਰ ਅਤੇ ਮੁੱਖ ਵਿਸ਼ਿਆਂ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।"
      },
      family_compatibility: {
        title: "ਪਰਿਵਾਰਕ ਅਨੁਕੂਲਤਾ",
        description: "ਆਪਣੇ ਪਰਿਵਾਰ ਅਤੇ ਦੋਸਤਾਂ ਨਾਲ ਭਾਵਨਾਤਮਕ, ਕਰਮ ਅਤੇ ਅਨੁਕੂਲਤਾ ਦੇ ਪੈਟਰਨਾਂ ਨੂੰ ਟਰੈਕ ਕਰੋ।"
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "ਪ੍ਰੀਮੀਅਮ ਦਸ਼ਾ ਵਿਸ਼ਲੇਸ਼ਣ",
        description: "ਦਸ਼ਾ ਸਮੇਂ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ ਲਈ ਇੱਕ ਪ੍ਰੀਮੀਅਮ ਗਾਹਕੀ ਦੀ ਲੋੜ ਹੁੰਦੀ ਹੈ।"
      },
      ashtakavargaanalysis: {
        title: "ਅਸ਼ਟਕਵਰਗ ਵਿਸ਼ਲੇਸ਼ਣ",
        description: "ਇੱਕ ਪ੍ਰੋ ਯੋਜਨਾ ਨਾਲ ਅਸ਼ਟਕਵਰਗ ਸਕੋਰਾਂ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।"
      },
      planetstrengthranking: {
        title: "ਗ੍ਰਹਿ ਬਲ ਰੈਂਕਿੰਗ",
        description: "ਇੱਕ ਪ੍ਰੋ ਯੋਜਨਾ ਨਾਲ ਵਿਸਤ੍ਰਿਤ ਗ੍ਰਹਿ ਬਲ ਰੈਂਕਿੰਗ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।"
      },
      currenttransits: {
        title: "ਮੌਜੂਦਾ ਗੋਚਰ",
        description: "ਇੱਕ ਪ੍ਰੋ ਯੋਜਨਾ ਨਾਲ ਮੌਜੂਦਾ ਗ੍ਰਹਿ ਗੋਚਰ ਵਿਸ਼ਲੇਸ਼ਣ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।"
      },
      keylifethemes: {
        title: "ਮੁੱਖ ਜੀਵਨ ਵਿਸ਼ੇ",
        description: "ਇੱਕ ਪ੍ਰੋ ਯੋਜਨਾ ਨਾਲ ਮੁੱਖ ਜੀਵਨ ਵਿਸ਼ਿਆਂ ਦੇ ਵਿਸ਼ਲੇਸ਼ਣ ਨੂੰ ਅਨਲੌਕ ਕਰੋ।"
      }
    }
  },
  ta: {
    credits: "கிரெடிட்கள்",
    creditsRequired: "கிரெடிட்கள் தேவை",
    creditSingle: "கிரெடிட்",
    creditPlural: "கிரெடிட்கள்",
    required: "தேவை",
    creditsRequiredLabel: "கிரெடிட்கள் தேவை",
    currentTier: "தற்போதைய நிலை: {tier}",
    viewPlansUpgrade: "திட்டங்களைப் பார்த்து மேம்படுத்தவும்",
    viewPlans: "திட்டங்களைப் பார்க்கவும்",
    products: {
      pro_monthly: "ப்ரோ மாதாந்திரம்",
      credit_pack_10: "10 கிரெடிட்கள் பேக்"
    },
    features: {
      chat_message: {
        title: "AI அரட்டை கிரெடிட்கள்",
        description: "எங்கள் சிறப்பு வேத AI ஜோதிடர்களுடன் கலந்தாலோசிக்கவும். ஒவ்வொரு செய்திக்கும் கிரெடிட் பயன்படுத்தப்படுகிறது."
      },
      full_daily_horoscope: {
        title: "முழு தினசரி ஜாதகம்",
        description: "உங்கள் ஜாதகத்தின் அடிப்படையில் தனிப்பயனாக்கப்பட்ட பகுதி நுண்ணறிவுகள், கோச்சாரம் மற்றும் தினசரி எச்சரிக்கைகளைப் பெறுங்கள்."
      },
      tomorrow_horoscope: {
        title: "நாளைய ராசிபலன்",
        description: "நாளைய விண்வெளி கணிப்பைக் கண்டு முன்கூட்டியே திட்டமிடுங்கள்."
      },
      guided_consult: {
        title: "வழிகாட்டப்பட்ட அமர்வுகள்",
        description: "தனிப்பயனாக்கப்பட்ட, ஆழமான படிப்படியான வாழ்க்கை ஆலோசனை."
      },
      match_report: {
        title: "பொருத்த அறிக்கை",
        description: "முழுமையான 36-புள்ளி குண மிலன், கூட்டாளர் ஒத்திசைவு மற்றும் உறவு இணக்க பகுப்பாய்வை அன்லாக் செய்யவும்."
      },
      kundli_premium: {
        title: "பிரீமியம் ஜாதகம்",
        description: "மேம்பட்ட கிரக கால விவரங்கள், அஷ்டகவர்க்கம், கோச்சாரம் மற்றும் முக்கிய தலைப்புகளை அன்லாக் செய்யவும்."
      },
      family_compatibility: {
        title: "குடும்ப பொருத்தம்",
        description: "உங்கள் குடும்பத்தினர் மற்றும் நண்பர்களுடனான உணர்ச்சி மற்றும் பொருத்த வடிவங்களைக் கண்காணிக்கவும்."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "பிரீமியம் தசா பகுப்பாய்வு",
        description: "தசா நேர பகுப்பாய்விற்கு பிரீமியம் சந்தா தேவைப்படுகிறது."
      },
      ashtakavargaanalysis: {
        title: "அஷ்டகவர்க்க பகுப்பாய்வு",
        description: "ப்ரோ திட்டத்துடன் அஷ்டகவர்க்க மதிப்பெண்களை அன்லாக் செய்யவும்."
      },
      planetstrengthranking: {
        title: "கிரக பல தரவரிசை",
        description: "ப்ரோ திட்டத்துடன் விரிவான கிரக பல தரவரிசைகளை அன்லாக் செய்யவும்."
      },
      currenttransits: {
        title: "தற்போதைய கோச்சாரம்",
        description: "ப்ரோ திட்டத்துடன் தற்போதைய கிரக கோச்சார பகுப்பாய்வை அன்லாக் செய்யவும்."
      },
      keylifethemes: {
        title: "முக்கிய வாழ்க்கை கருப்பொருள்கள்",
        description: "ப்ரோ திட்டத்துடன் முக்கிய வாழ்க்கை கருத்து நுண்ணறிவுகளை அன்லாக் செய்யவும்."
      }
    }
  },
  te: {
    credits: "क्रेडिटస్",
    creditsRequired: "క్రెడిట్స్ అవసరం",
    creditSingle: "క్రెడిట్",
    creditPlural: "क्रेडिटస్",
    required: "అవసరం",
    creditsRequiredLabel: "క్రెడిట్స్ అవసరం",
    currentTier: "ప్రస్తుత శ్రేణి: {tier}",
    viewPlansUpgrade: "ప్లాన్‌లను వీక్షించండి & అప్‌గ్రేడ్ చేయండి",
    viewPlans: "ప్లాన్‌లను వీక్షించండి",
    products: {
      pro_monthly: "ప్రో మంత్లీ",
      credit_pack_10: "10 క్రెడిట్స్ ప్యాక్"
    },
    features: {
      chat_message: {
        title: "AI చాట్ క్రెడిట్స్",
        description: "మా ప్రత్యేక వైదిక AI జ్యోతిష్యులను సంప్రదించండి. ప్రతి సందేశానికి క్రెడిట్ ఉపయోగించబడుతుంది."
      },
      full_daily_horoscope: {
        title: "పూర్తి దినసరి రాశిఫలం",
        description: "మీ జాతకం ఆధారంగా వ్యక్తిగతీకరించిన క్షేత్ర అంతర్దృష్టులు, గోచారం మరియు రోజువారీ హెచ్చరికలను పొందండి."
      },
      tomorrow_horoscope: {
        title: "రేపటి రాశిఫలం",
        description: "రేపటి విశ్వ సూచనను వీక్షించండి మరియు ముందుగానే ప్రణాళిక చేసుకోండి."
      },
      guided_consult: {
        title: "మార్గదర్శక సెషన్లు",
        description: "వ్యక్తిగతీకరించిన, లోతైన దశల వారీ జీవిత సంప్రదింపులు."
      },
      match_report: {
        title: "సరుకు నివేదిక",
        description: "పూర్తి 36-పాయింట్ల గుణ మిలన్, భాగస్వామి సమకాలీకరణ మరియు సంబంధ సామరస్య విశ్లేషణను అన్‌లాక్ చేయండి."
      },
      kundli_premium: {
        title: "ప్రీమియం జాతకం",
        description: "అధునాతన గ్రహ కాలాల వివరాలు, అష్టకవర్గము, గోచారం మరియు ముఖ్యమైన విషయాలను అన్‌లాక్ చేయండి."
      },
      family_compatibility: {
        title: "కుటుంబ అనుకూలత",
        description: "మీ కుటుంబం మరియు స్నేహితులతో భావోద్వేగ, కర్మ మరియు అనుకూలత నమూనాలను ట్రాక్ చేయండి."
      }
    },
    custom: {
      premiumdashaanalysis: {
        title: "ప్రీమియం దశా విశ్లేషణ",
        description: "దశా సమయ విశ్లేషణకు ప్రీమియం సభ్యత్వం అవసరం."
      },
      ashtakavargaanalysis: {
        title: "అష్టకవర్గ విశ్లేషణ",
        description: "ప్రో ప్లాన్‌తో అష్టకవర్గ స్కోర్‌లను అన్‌లాక్ చేయండి."
      },
      planetstrengthranking: {
        title: "గ్రహాల బలం ర్యాంకింగ్",
        description: "ప్రో ప్లాన్‌తో వివరణాత్మక గ్రహాల బలం ర్యాంకింగ్‌లను అన్‌లాక్ చేయండి."
      },
      currenttransits: {
        title: "ప్రస్తుత గోచారం",
        description: "ప్రో ప్లాన్‌తో ప్రస్తుత గ్రహాల గోచార విశ్లేషణను అన్‌లాక్ చేయండి."
      },
      keylifethemes: {
        title: "ముఖ్యమైన జీవిత విషయాలు",
        description: "ప్రో ప్లాన్‌తో ముఖ్యమైన జీవిత విషయాల అంతర్దృష్టులను అన్‌లాక్ చేయండి."
      }
    }
  }
};

// Define missing "newDashboard" keys that need to be injected for ALL non-English/non-Hindi files
// These keys will be added under "newDashboard" root or sub-blocks.
const missingDashboardKeys = {
  bn: {
    unlock: "আনলক",
    view: "দেখুন",
    chartSnapshot: "আমার কুন্ডলী স্ন্যাপশট",
    guidanceHub: "আপনার নির্দেশিকা কেন্দ্র",
    exploreCosmicNetwork: "আপনার মহাজাগতিক নেটওয়ার্ক অন্বেষণ করুন",
    cosmicNetworkDesc: "বিশেষজ্ঞ গাইডদের সাথে সংযোগ করুন, আপনার চার্ট অন্বেষণ করুন, আপনার বন্ধনগুলি বুঝুন এবং শক্তিশালী জ্যোতিষশাস্ত্রীয় সরঞ্জামগুলি অ্যাক্সেস করুন।",
    meetYourAiAstrologers: "আপনার AI জ্যোতিষীদের সাথে দেখা করুন",
    linked: "✓ সংযুক্ত",
    celestial: "মহাজাগতিক",
    insights: "অন্তর্দৃষ্টি",
    exploreAllPortals: "সমস্ত পোর্টাল অন্বেষণ করুন",
    viewToday: "আজকের দেখুন",
    rashiLibrary: "রাশি লাইব্রেরি",
    portalChatDesc: "আপনার কুন্ডলী, দশা, গোচর বা জীবন নির্দেশিকা সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।",
    portalSoulmateDesc: "গুণ মিলন এবং কর্মফল অন্তর্দৃষ্টি ব্যবহার করে সামঞ্জস্যের মিল করুন।",
    portalPulseDesc: "আপনার দিনের জন্য রিয়েল-টাইম তিথি, যোগ এবং বৈদিক শক্তি।",
    portalRashiDesc: "বিস্তারিত বৈশিষ্ট্য এবং অন্তর্দৃষ্টি সহ সমস্ত ১২টি রাশি অন্বেষণ করুন।",
    portalSessionsDesc: "লাইভ সেশনে যোগ দিন এবং বিশেষজ্ঞ ও সন্ধানীদের সাথে যোগাযোগ করুন।",
    guides: {
      navi: { role: "সাধারণ বৈদিক গাইড", desc: "প্রেম, কাজ, সময় এবং জীবনের জন্য সুষম বৈদিক গাইড।" },
      arya: { role: "করিয়ার মেন্টর", desc: "চাকরি, দক্ষতা, পদোন্নতি এবং কাজের সিদ্ধান্তের জন্য গাইড।" },
      meera: { role: "সম্পর্ক গাইড", desc: "প্রেম, বিবাহ, সামঞ্জস্য এবং আবেগের অন্তর্দৃষ্টি।" },
      anand: { role: "স্বাস্থ্য উপদেষ্টা", desc: "জীবনশক্তি, সুস্থতা এবং স্বাস্থ্যের ধরণগুলি বুঝুন।" },
      vidya: { role: "আর্থিক জ্যোতিষী", desc: "সম্পদ, বিনিয়োগ এবং আর্থিক স্থিতিশীলতার অন্তর্দৃষ্টি।" },
      rishi: { role: "গভীর চার্ট ঋষি", desc: "গভীর আধ্যাত্মিক অন্তর্দৃষ্টির জন্য উন্নত চার্ট সংশ্লেষণ।" },
      locked: "লক করা"
    },
    notableTransits: {
      jupiter: "বৃহস্পতির গোচর আপনার লাভ বাড়ায় এবং বৃদ্ধিকে স্থিতিশীল করে।",
      saturn: "শনির গোচর আপনার শৃঙ্খলা পরীক্ষা করে এবং স্থিতিস্থাপকতা তৈরি করে।",
      rahu: "রাহুর গোচর পুরানো ধরণগুলিকে অস্থিতিশীল করে - মাটিতে থাকুন।",
      ketu: "কেতু জিনিসগুলি ছেড়ে দিতে এবং আসক্তি মুক্ত হতে সহায়তা করে।"
    },
    cosmicInsight: {
      title: "দৈনিক মহাজাগতিক অন্তর্দৃষ্টি",
      luckyColor: "শুভ রং",
      luckyNumber: "শুভ সংখ্যা"
    },
    deepDive: {
      title: "গভীর বিশ্লেষণ",
      deepDiveQ1: "আমার সাপ্তাহিক পূর্বাভাস বিস্তারিতভাবে বিশ্লেষণ করুন",
      deepDiveQ2: "আমার {area} স্কোর তার বর্তমান স্তরে কেন?",
      deepDiveQ3: "আমার স্কোর উন্নত করার জন্য আমাকে একটি দ্রুত সমাধান বলুন"
    },
    privacy: {
      protected: "আপনার ডেটা ব্যক্তিগত এবং সুরক্ষিত।",
      secure: "সুরক্ষিত",
      encrypted: "এনক্রিপ্ট করা",
      trusted: "হাজার হাজার মানুষের দ্বারা বিশ্বস্ত"
    },
    todaysEnergy: {
      scoreImpressive: "আপনার {label} স্কোর চিত্তাকর্ষক!",
      goodTimeDesc: "গুরুত্বপূর্ণ কাজ এবং সিদ্ধান্তের জন্য শুভ সময়।",
      cautionTimeDesc: "নতুন কাজ শুরু করা বা বড় প্রতিশ্রুতি দেওয়া এড়িয়ে চলুন।",
      askNaviInChat: "চ্যাটে Navi-কে জিজ্ঞাসা করবেন?",
      askNaviConfirmDesc: "Navi এই প্রশ্নটি নিয়ে চ্যাট খুলবে যাতে আপনি সেখান থেকে শুরু করতে পারেন।",
      stayHere: "এখানেই থাকুন",
      openChat: "চ্যাট খুলুন",
      explainMsg: "আমার জন্য আজকের শক্তি ব্যাখ্যা করুন। আমার সামগ্রিক স্কোর {score}।",
      discussMsg: "আমি আমার ড্যাশবোর্ড এবং আজকের রাশিফল নিয়ে আলোচনা করতে চাই।"
    }
  },
  gu: {
    unlock: "અનલૉક",
    view: "જુઓ",
    chartSnapshot: "મારી કુંડળી સ્નેપશોટ",
    guidanceHub: "તમારું માર્ગદર્શન કેન્દ્ર",
    exploreCosmicNetwork: "તમારા બ્રહ્માંડિય નેટવર્કનું અન્વેષણ કરો",
    cosmicNetworkDesc: "નિષ્ણાત માર્ગદર્શકો સાથે જોડાઓ, તમારા ચાર્ટનું અન્વેષણ કરો, તમારા સંબંધોને સમજો અને શક્તિશાળી જ્યોતિષીય સાધનોનો ઉપયોગ કરો.",
    meetYourAiAstrologers: "તમારા AI જ્યોતિષીઓને મળો",
    linked: "✓ લિંક કરેલ",
    celestial: "બ્રહ્માંડિય",
    insights: "આંતરદૃષ્ટિ",
    exploreAllPortals: "તમામ પોર્ટલનું અન્વેષણ કરો",
    viewToday: "આજનું જુઓ",
    rashiLibrary: "રાશિ લાઇબ્રેરી",
    portalChatDesc: "તમારી કુંડળી, દશા, ગોચર અથવા જીવન માર્ગદર્શન વિશે કંઈપણ પૂછો.",
    portalSoulmateDesc: "ગુણ મિલન અને કર્મની આંતરદૃષ્ટિનો ઉપયોગ કરીને અનુકૂળતા મેળવો.",
    portalPulseDesc: "તમારા દિવસ માટે રીઅલ-ટાઇમ તિથિ, યોગ અને વૈદિક ઉર્જા.",
    portalRashiDesc: "વિગતવાર લક્ષણો અને આંતરદૃષ્ટિ સાથે તમામ ૧૨ રાશિઓનું અન્વેષણ કરો.",
    portalSessionsDesc: "લાઇવ સત્રોમાં જોડાઓ અને નિષ્ણાતો અને સાધકો સાથે વાતચીત કરો.",
    guides: {
      navi: { role: "સામાન્ય વૈદિક માર્ગદર્શક", desc: "પ્રેમ, કાર્ય, સમય અને જીવન માટે સંતુલિત વૈદિક માર્ગદર્શન." },
      arya: { role: "કરિયર માર્ગદર્શક", desc: "નોકરી, કૌશલ્ય, બઢતી અને કાર્યના નિર્ણયો માટે માર્ગદર્શન." },
      meera: { role: "સંબંધ માર્ગદર્શક", desc: "પ્રેમ, લગ્ન, અનુકૂળતા અને લાગણીઓ માટે આંતરદૃષ્ટિ." },
      anand: { role: "આરોગ્ય સલાહકાર", desc: "જીવનશક્તિ, સુખાકારી અને આરોગ્યની પેટર્નને સમજો." },
      vidya: { role: "નાણાકીય જ્યોતિષી", desc: "સંપત્તિ, રોકાણ અને નાણાકીય સ્થિરતાની આંતરદૃષ્ટિ." },
      rishi: { role: "ઊંડા ચાર્ટ ઋષિ", desc: "ઊંડી આધ્યાત્મિક આંતરદૃષ્ટિ માટે અદ્યતન ચાર્ટ સંશ્લેષણ." },
      locked: "લૉક કરેલ"
    },
    notableTransits: {
      jupiter: "ગુરુનું ગોચર તમારા લાભમાં વધારો કરે છે અને વૃદ્ધિને સ્થિર કરે છે.",
      saturn: "શનિનું ગોચર તમારી શિસ્તની કસોટી કરે છે અને સ્થિતિસ્થાપકતા બનાવે છે.",
      rahu: "રાહુનું ગોચર જૂની પેટર્નને અસ્થિર કરે છે - જમીન સાથે જોડાયેલા રહો.",
      ketu: "કેતુ વસ્તુઓ છોડવા અને આસક્તિ મુક્ત થવામાં મદદ કરે છે."
    },
    cosmicInsight: {
      title: "દૈનિક બ્રહ્માંડિય આંતરદૃષ્ટિ",
      luckyColor: "શુભ રંગ",
      luckyNumber: "શુભ અંક"
    },
    deepDive: {
      title: "ઊંડાણપૂર્વક વિશ્લેષણ",
      deepDiveQ1: "મારી સાપ્તાહિક આગાહીનું વિગતવાર વિશ્લેષણ કરો",
      deepDiveQ2: "મારો {area} સ્કોર તેના વર્તમાન સ્તર પર કેમ છે?",
      deepDiveQ3: "મારા સ્કોરને સુધારવા માટે મને એક ઝડપી ઉપાય જણાવો"
    },
    privacy: {
      protected: "તમારો ડેટા ખાનગી અને સુરક્ષિત છે.",
      secure: "સુરક્ષિત",
      encrypted: "એન્ક્રિપ્ટેડ",
      trusted: "હજારો લોકો દ્વારા વિશ્વસનીય"
    },
    todaysEnergy: {
      scoreImpressive: "તમારો {label} સ્કોર પ્રભાવશાળી છે!",
      goodTimeDesc: "મહત્વપૂર્ણ કાર્યો અને નિર્ણયો માટે શુભ સમય.",
      cautionTimeDesc: "નવું કાર્ય શરૂ કરવાનું અથવા મોટી પ્રતિબદ્ધતાઓ ટાળો.",
      askNaviInChat: "ચેટમાં Navi ને પૂછવું છે?",
      askNaviConfirmDesc: "Navi આ પ્રશ્ન સાથે ચેટ ખોલશે જેથી તમે ત્યાંથી શરૂ કરી શકો.",
      stayHere: "અહીં જ રહો",
      openChat: "ચેટ ખોલો",
      explainMsg: "મારા માટે આજની ઉર્જા સમજાવો. મારો એકંદર સ્કોર {score} છે.",
      discussMsg: "હું મારા ડેશબોર્ડ અને આજના રાશિફળની ચર્ચા કરવા માંગુ છું."
    }
  },
  kn: {
    unlock: "ಅನ್ಲಾಕ್",
    view: "ವೀಕ್ಷಿಸಿ",
    chartSnapshot: "ನನ್ನ ಜಾತಕ ಸ್ನ್ಯಾಪ್‌ಶಾಟ್",
    guidanceHub: "ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶನ ಕೇಂದ್ರ",
    exploreCosmicNetwork: "ನಿಮ್ಮ ಬ್ರಹ್ಮಾಂಡದ ನೆಟ್‌ವರ್ಕ್ ಅನ್ನು ಅನ್ವೇಷಿಸಿ",
    cosmicNetworkDesc: "ತಜ್ಞ ಮಾರ್ಗದರ್ಶಕರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ, ನಿಮ್ಮ ಚಾರ್ಟ್ ಅನ್ನು ಅನ್ವೇಷಿಸಿ, ನಿಮ್ಮ ಬಾಂಧವ್ಯಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ ಮತ್ತು ಶಕ್ತಿಶಾಲಿ ಜ್ಯೋತಿಷ್ಯ ಪರಿಕರಗಳನ್ನು ಪ್ರವೇಶಿಸಿ.",
    meetYourAiAstrologers: "ನಿಮ್ಮ AI ಜ್ಯೋತಿಷಿಗಳನ್ನು ಭೇಟಿ ಮಾಡಿ",
    linked: "✓ ಲಿಂಕ್ ಮಾಡಲಾಗಿದೆ",
    celestial: "ಬ್ರಹ್ಮಾಂಡದ",
    insights: "ಒಳನೋಟಗಳು",
    exploreAllPortals: "ಎಲ್ಲಾ ಪೋರ್ಟಲ್‌ಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    viewToday: "ಇಂದಿನದನ್ನು ವೀಕ್ಷಿಸಿ",
    rashiLibrary: "ರಾಶಿ ಲೈಬ್ರರಿ",
    portalChatDesc: "ನಿಮ್ಮ ಜಾತಕ, ದಶಾ, ಗೋಚಾರ ಅಥವಾ ಜೀವನ ಮಾರ್ಗದರ್ಶನದ ಬಗ್ಗೆ ಯಾವುದನ್ನಾದರೂ ಕೇಳಿ.",
    portalSoulmateDesc: "ಗುಣ ಮಿಲನ ಮತ್ತು ಕರ್ಮದ ಒಳನೋಟಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಹೊಂದಾಣಿಕೆಯನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ.",
    portalPulseDesc: "ನಿಮ್ಮ ದಿನಕ್ಕಾಗಿ ನೈಜ-ಸಮಯದ ತಿಥಿ, ಯೋಗ ಮತ್ತು ವೈದಿಕ ಶಕ್ತಿ.",
    portalRashiDesc: "ವಿವರವಾದ ಲಕ್ಷಣಗಳು ಮತ್ತು ಒಳನೋಟಗಳೊಂದಿಗೆ ಎಲ್ಲಾ ೧೨ ರಾಶಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.",
    portalSessionsDesc: "ಲೈವ್ ಸೆಷನ್‌ಗಳಲ್ಲಿ ಭಾಗವಹಿಸಿ ಮತ್ತು ತಜ್ಞರು ಹಾಗೂ ಸಾಧಕರೊಂದಿಗೆ ಸಂವಹನ ನಡೆಸಿ.",
    guides: {
      navi: { role: "ಸಾಮಾನ್ಯ ವೈದಿಕ ಮಾರ್ಗದರ್ಶಿ", desc: "ಪ್ರೇಮ, ಕೆಲಸ, ಸಮಯ ಮತ್ತು ಜೀವನಕ್ಕಾಗಿ ಸಮತೋಲಿತ ವೈದಿಕ ಮಾರ್ಗದರ್ಶನ." },
      arya: { role: "ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶಿ", desc: "ಉದ್ಯೋಗಗಳು, ಕೌಶಲ್ಯಗಳು, ಬಡ್ತಿ ಮತ್ತು ಕೆಲಸದ ನಿರ್ಧಾರಗಳಿಗಾಗಿ ಮಾರ್ಗದರ್ಶನ." },
      meera: { role: "ಸಂಬಂಧ ಮಾರ್ಗದರ್ಶಿ", desc: "ಪ್ರೇಮ, ವಿವಾಹ, ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಭಾವನೆಗಳ ಒಳನೋಟಗಳು." },
      anand: { role: "ಆರೋಗ್ಯ ಸಲಹೆಗಾರ", desc: "ಜೀವಶಕ್ತಿ, ಯೋಗಕ್ಷೇಮ ಮತ್ತು ಆರೋಗ್ಯದ ಮಾದರಿಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ." },
      vidya: { role: "ಹಣಕಾಸು ಜ್ಯೋತಿಷಿ", desc: "ಸಂಪತ್ತು, ಹೂಡಿಕೆಗಳು ಮತ್ತು ಆರ್ಥಿಕ ಸ್ಥಿರತೆಯ ಒಳನೋಟಗಳು." },
      rishi: { role: "ಆಳವಾದ ಚಾರ್ಟ್ ಋಷಿ", desc: "ಆಳವಾದ ಆಧ್ಯಾತ್ಮಿಕ ಒಳನೋಟಗಳಿಗಾಗಿ ಸುಧಾರಿತ ಚಾರ್ಟ್ ಸಂಶ್ಲೇಷಣೆ." },
      locked: "ಲಾಕ್ ಮಾಡಲಾಗಿದೆ"
    },
    notableTransits: {
      jupiter: "ಗುರುವಿನ ಗೋಚಾರವು ನಿಮ್ಮ ಲಾಭವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ ಮತ್ತು ಬೆಳವಣಿಗೆಯನ್ನು ಸ್ಥಿರಗೊಳಿಸುತ್ತದೆ.",
      saturn: "ಶನಿಯ ಗೋಚಾರವು ನಿಮ್ಮ ಶಿಸ್ತನ್ನು ಪರೀಕ್ಷಿಸುತ್ತದೆ ಮತ್ತು ಸ್ಥಿತಿಸ್ಥಾಪಕತ್ವವನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ.",
      rahu: "ರಾಹುವಿನ ಗೋಚಾರವು ಹಳೆಯ ಮಾದರಿಗಳನ್ನು ಅಸ್ಥಿರಗೊಳಿಸುತ್ತದೆ - ನೆಲದ ಮೇಲಿರಿ.",
      ketu: "ಕೇತುವು ವಿಷಯಗಳನ್ನು ಬಿಟ್ಟುಬಿಡಲು ಮತ್ತು ಆಸಕ್ತಿ ಮುಕ್ತವಾಗಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ."
    },
    cosmicInsight: {
      title: "ದೈನಂದಿನ ಬ್ರಹ್ಮಾಂಡದ ಒಳನೋಟ",
      luckyColor: "ಶುಭ ಬಣ್ಣ",
      luckyNumber: "ಶುಭ ಸಂಖ್ಯೆ"
    },
    deepDive: {
      title: "ಆಳವಾದ ವಿಶ್ಲೇಷಣೆ",
      deepDiveQ1: "ನನ್ನ ವಾರಿಕ ಮುನ್ಸೂಚನೆಯನ್ನು ವಿವರವಾಗಿ ವಿಶ್ಲೇಷಿಸಿ",
      deepDiveQ2: "ನನ್ನ {area} ಸ್ಕೋರ್ ಅದರ ಪ್ರಸ್ತುತ ಮಟ್ಟದಲ್ಲಿ ಏಕೆ ಇದೆ?",
      deepDiveQ3: "ನನ್ನ ಸ್ಕೋರ್ ಸುಧಾರಿಸಲು ನನಗೆ ತ್ವರಿತ ಪರಿಹಾರ ತಿಳಿಸಿ"
    },
    privacy: {
      protected: "ನಿಮ್ಮ ಡೇಟಾ ಖಾಸಗಿ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿದೆ.",
      secure: "ಸುರಕ್ಷಿತ",
      encrypted: "ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾಗಿದೆ",
      trusted: "ಸಾವಿರಾರು ಜನರಿಂದ ನಂಬಲ್ಪಟ್ಟಿದೆ"
    },
    todaysEnergy: {
      scoreImpressive: "ನಿಮ್ಮ {label} ಸ್ಕೋರ್ ಆಕರ್ಷಕವಾಗಿದೆ!",
      goodTimeDesc: "ಪ್ರಮುಖ ಕೆಲಸಗಳು ಮತ್ತು ನಿರ್ಧಾರಗಳಿಗೆ ಶುಭ ಸಮಯ.",
      cautionTimeDesc: "ಹೊಸ ಕೆಲಸವನ್ನು ಪ್ರಾರಂಭಿಸುವುದು ಅಥವಾ ಪ್ರಮುಖ ಬದ್ಧತೆಗಳನ್ನು ತಪ್ಪಿಸಿ.",
      askNaviInChat: "ಚಾಟ್‌ನಲ್ಲಿ Navi ಯನ್ನು ಕೇಳಬೇಕೆ?",
      askNaviConfirmDesc: "Navi ಈ ಪ್ರಶ್ನೆಯೊಂದಿಗೆ ಚಾಟ್ ತೆರೆಯುತ್ತದೆ ಇದರಿಂದ ನೀವು ಅಲ್ಲಿಂದ ಮುಂದುವರಿಯಬಹುದು.",
      stayHere: "ಇಲ್ಲೇ ಇರಿ",
      openChat: "ಚಾಟ್ ತೆರೆಯಿರಿ",
      explainMsg: "ನನಗಾಗಿ ಇಂದಿನ ಶಕ್ತಿಯನ್ನು ವಿವರಿಸಿ. ನನ್ನ ಒಟ್ಟಾರೆ ಸ್ಕೋರ್ {score} ಆಗಿದೆ.",
      discussMsg: "ನಾನು ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ಇಂದಿನ ರಾಶಿಫಲದ ಬಗ್ಗೆ ಚರ್ಚಿಸಲು ಬಯಸುತ್ತೇನೆ."
    }
  },
  ko: {
    unlock: "잠금 해제",
    view: "보기",
    chartSnapshot: "나의 차트 스냅샷",
    guidanceHub: "나의 가이드 센터",
    exploreCosmicNetwork: "우주 네트워크 탐색",
    cosmicNetworkDesc: "전문 가이드와 연결하고, 내 차트를 탐색하며, 관계를 이해하고 강력한 점성술 도구에 액세스하세요.",
    meetYourAiAstrologers: "AI 점성술사 만나기",
    linked: "✓ 연결됨",
    celestial: "천체의",
    insights: "통찰",
    exploreAllPortals: "모든 포털 탐색",
    viewToday: "오늘 보기",
    rashiLibrary: "라시 라이브러리",
    portalChatDesc: "쿤들리, 다샤, 행성 이동 또는 삶의 가이드에 대해 무엇이든 물어보세요.",
    portalSoulmateDesc: "구나 밀란 및 카르마 통찰력을 사용해 궁합을 매칭해 보세요.",
    portalPulseDesc: "오늘 하루의 실시간 티티, 요가 및 베딕 에너지입니다.",
    portalRashiDesc: "상세한 특징과 통찰력으로 12개 별자리를 모두 탐색해 보세요.",
    portalSessionsDesc: "라이브 세션에 참여하고 전문가 및 탐구자들과 소통하세요.",
    guides: {
      navi: { role: "일반 베딕 가이드", desc: "사랑, 일, 타이밍, 삶에 대한 균형 잡힌 베딕 안내를 제공합니다." },
      arya: { role: "커리어 멘토", desc: "직업, 기술, 승진 및 업무 결정에 대한 안내를 제공합니다." },
      meera: { role: "관계 가이드", desc: "사랑, 결혼, 궁합, 감정에 대한 통찰을 제공합니다." },
      anand: { role: "건강 고문", desc: "활력, 웰빙 및 건강 패턴을 분석합니다." },
      vidya: { role: "금융 점성술사", desc: "부, 투자 및 금융 안정성에 대한 통찰을 제공합니다." },
      rishi: { role: "심층 차트 현자", desc: "깊은 영적 통찰을 위한 고급 차트 종합 분석을 제공합니다." },
      locked: "잠김"
    },
    notableTransits: {
      jupiter: "목성의 이동은 이익을 증대시키고 성장을 안정시킵니다.",
      saturn: "토성의 이동은 규율을 시험하고 회복 탄력성을 구축합니다.",
      rahu: "라후의 이동은 오래된 패턴을 흔들어 놓습니다 - 중심을 잡으세요.",
      ketu: "케투는 집착을 내려놓고 마음을 비우는 것을 돕습니다."
    },
    cosmicInsight: {
      title: "오늘의 우주 통찰",
      luckyColor: "행운의 색상",
      luckyNumber: "행운의 숫자"
    },
    deepDive: {
      title: "심층 분석",
      deepDiveQ1: "내 주간 예측을 자세히 분석해 주세요",
      deepDiveQ2: "내 {area} 점수가 현재 수준인 이유는 무엇인가요?",
      deepDiveQ3: "내 점수를 개선하기 위한 빠른 팁을 주세요"
    },
    privacy: {
      protected: "귀하의 데이터는 안전하게 보호됩니다.",
      secure: "보안",
      encrypted: "암호화됨",
      trusted: "수천 명의 신뢰를 받는"
    },
    todaysEnergy: {
      scoreImpressive: "귀하의 {label} 점수가 매우 인상적입니다!",
      goodTimeDesc: "중요한 업무와 결정을 내리기에 상서로운 시간입니다.",
      cautionTimeDesc: "새로운 일을 시작하거나 큰 약속을 하는 것을 피하세요.",
      askNaviInChat: "채팅에서 Navi에게 물어볼까요?",
      askNaviConfirmDesc: "대화를 이어서 진행할 수 있도록 Navi가 이 질문으로 채팅창을 엽니다.",
      stayHere: "여기에 머물기",
      openChat: "채팅 열기",
      explainMsg: "오늘의 에너지를 설명해 주세요. 내 종합 점수는 {score}점입니다.",
      discussMsg: "대시보드와 오늘의 운세에 대해 이야기하고 싶습니다."
    }
  },
  ml: {
    unlock: "അൺലോക്ക് ചെയ്യുക",
    view: "കാണുക",
    chartSnapshot: "എന്റെ ജാതക സ്നാപ്ഷോട്ട്",
    guidanceHub: "നിങ്ങളുടെ മാർഗ്ഗനിർദ്ദേശ കേന്ദ്രം",
    exploreCosmicNetwork: "നിങ്ങളുടെ ബ്രഹ്മാണ്ഡ ശൃംഖല പര്യവേക്ഷണം ചെയ്യുക",
    cosmicNetworkDesc: "വിദഗ്ദ്ധ ഗൈഡുകളുമായി ബന്ധപ്പെടുക, നിങ്ങളുടെ ചാർട്ട് പര്യവേക്ഷണം ചെയ്യുക, നിങ്ങളുടെ ബന്ധങ്ങൾ മനസ്സിലാക്കുക, ശക്തമായ ജ്യോതിഷ ഉപകരണങ്ങൾ ആക്സസ് ചെയ്യുക.",
    meetYourAiAstrologers: "നിങ്ങളുടെ AI ജ്യോതിഷികളെ പരിചയപ്പെടുക",
    linked: "✓ ബന്ധിപ്പിച്ചു",
    celestial: "ബ്രഹ്മാണ്ഡ",
    insights: "ഉൾക്കാഴ്ചകൾ",
    exploreAllPortals: "എല്ലാ പോർട്ടലുകളും പര്യവേക്ഷണം ചെയ്യുക",
    viewToday: "ഇന്നത്തെ കാണുക",
    rashiLibrary: "രാശി ലൈബ്രറി",
    portalChatDesc: "നിങ്ങളുടെ കുണ്ഡലി, ദശകൾ, ഗോചാരം അല്ലെങ്കിൽ ജീവിത മാർഗ്ഗനിർദ്ദേശം എന്നിവയെക്കുറിച്ച് ചോദിക്കുക.",
    portalSoulmateDesc: "ഗുണ പൊരുത്തവും കർമ്മ ഉൾക്കാഴ്ചകളും ഉപയോഗിച്ച് പൊരുത്തം നോക്കുക.",
    portalPulseDesc: "നിങ്ങളുടെ ദിവസത്തെ തത്സമയ തിഥി, യോഗ, വൈദിക ഊർജ്ജങ്ങൾ.",
    portalRashiDesc: "വിശദമായ സവിശേഷതകളോടെ എല്ലാ 12 രാശികളും പര്യവേക്ഷണം ചെയ്യുക.",
    portalSessionsDesc: "തത്സമയ സെഷനുകളിൽ പങ്കെടുക്കുക, വിദഗ്ദ്ധരുമായും അന്വേഷകരുമായും സംവദിക്കുക.",
    guides: {
      navi: { role: "പൊതു വൈദിക ഗൈഡ്", desc: "പ്രണയം, ജോലി, സമയം, ജീവിതം എന്നിവയ്ക്കുള്ള സന്തുലിത വൈദിക മാർഗ്ഗനിർദ്ദേശം." },
      arya: { role: "കരിയർ ഉപദേശകൻ", desc: "ജോലികൾ, കഴിവുകൾ, പ്രമോഷൻ, ജോലി തീരുമാനങ്ങൾ എന്നിവയ്ക്കുള്ള മാർഗ്ഗനിർദ്ദേശം." },
      meera: { role: "ബന്ധങ്ങളുടെ ഗൈഡ്", desc: "പ്രണയം, വിവാഹം, പൊരുത്തം, വികാരങ്ങൾ എന്നിവയ്ക്കുള്ള ഉൾക്കാഴ്ചകൾ." },
      anand: { role: "ആരോഗ്യ ഉപദേശകൻ", desc: "ജീവൻശക്തി, ആരോഗ്യം, ശാരീരിക പാറ്റേണുകൾ എന്നിവ മനസ്സിലാക്കുക." },
      vidya: { role: "ധനകാര്യ ജ്യോതിഷി", desc: "സമ്പത്ത്, നിക്ഷേപങ്ങൾ, സാമ്പത്തിക സ്ഥിരത ഉൾക്കാഴ്ചകൾ." },
      rishi: { role: "ആഴത്തിലുള്ള ചാർട്ട് മുനി", desc: "ആഴത്തിലുള്ള ആത്മീയ ഉൾക്കാഴ്ചകൾക്കായി വിപുലമായ ചാർട്ട് വിശകലനം." },
      locked: "പൂട്ടിയിരിക്കുന്നു"
    },
    notableTransits: {
      jupiter: "വ്യാഴത്തിന്റെ ഗോചാരം നിങ്ങളുടെ നേട്ടങ്ങൾ വർദ്ധിപ്പിക്കുകയും വളർച്ചയെ സുസ്ഥിരമാക്കുകയും ചെയ്യുന്നു.",
      saturn: "ശനിയുടെ ഗോചാരം നിങ്ങളുടെ അച്ചടക്കത്തെ പരീക്ഷിക്കുകയും പ്രതിരോധശേഷി നൽകുകയും ചെയ്യുന്നു.",
      rahu: "രാഹുവിന്റെ ഗോചാരം പഴയ പാറ്റേണുകളെ അസ്ഥിരപ്പെടുത്തുന്നു - ജാഗ്രത പാലിക്കുക.",
      ketu: "കേതു കാര്യങ്ങൾ ഉപേക്ഷിക്കുന്നതിനും അനാസക്തി നേടുന്നതിനും സഹായിക്കുന്നു."
    },
    cosmicInsight: {
      title: "പ്രതിദിന ബ്രഹ്മാണ്ഡ ഉൾക്കാഴ്ച",
      luckyColor: "ഭാഗ്യ നിറം",
      luckyNumber: "ഭാഗ്യ നമ്പർ"
    },
    deepDive: {
      title: "ആഴത്തിലുള്ള വിശകലനം",
      deepDiveQ1: "എന്റെ പ്രതിവാര പ്രവചനം വിശദമായി വിശകലനം ചെയ്യുക",
      deepDiveQ2: "എന്റെ {area} സ്കോർ നിലവിലെ തലത്തിൽ ആയിരിക്കുന്നത് എന്തുകൊണ്ട്?",
      deepDiveQ3: "എന്റെ സ്കോർ മെച്ചപ്പെടുത്താൻ ഒരു ദ്രുത പരിഹാരം പറഞ്ഞു തരൂ"
    },
    privacy: {
      protected: "നിങ്ങളുടെ ഡാറ്റ സ്വകാര്യവും സുരക്ഷിതവുമാണ്.",
      secure: "സുരക്ഷിതം",
      encrypted: "എൻക്രിപ്റ്റ് ചെയ്തത്",
      trusted: "ആയിരക്കണക്കിന് ആളുകൾ വിശ്വസിക്കുന്നത്"
    },
    todaysEnergy: {
      scoreImpressive: "നിങ്ങളുടെ {label} സ്കോർ മികച്ചതാണ്!",
      goodTimeDesc: "പ്രധാനപ്പെട്ട ജോലികൾക്കും തീരുമാനങ്ങൾക്കും അനുയോജ്യമായ സമയം.",
      cautionTimeDesc: "പുതിയ ജോലികൾ ആരംഭിക്കുന്നതോ പ്രധാനപ്പെട്ട കരാറുകളിൽ ഏർപ്പെടുന്നതോ ഒഴിവാക്കുക.",
      askNaviInChat: "ചാറ്റിൽ Navi-യോട് ചോദിക്കണോ?",
      askNaviConfirmDesc: "തുടർന്ന് സംസാരിക്കാനായി ഈ ചോദ്യത്തോടെ ചാറ്റ് വിൻഡോ തുറക്കുന്നതാണ്.",
      stayHere: "ഇവിടെ തുടരുക",
      openChat: "ചാറ്റ് തുറക്കുക",
      explainMsg: "ഇന്നത്തെ ഊർജ്ജത്തെക്കുറിച്ച് വിശദീകരിക്കുക. എന്റെ ആകെ സ്കോർ {score} ആണ്.",
      discussMsg: "എന്റെ ഡാഷ്ബോർഡും ഇന്നത്തെ രാശിഫലവും ചർച്ച ചെയ്യാൻ ഞാൻ ആഗ്രഹിക്കുന്നു."
    }
  },
  mr: {
    unlock: "अनलॉक",
    view: "पहा",
    chartSnapshot: "माझी कुंडली स्नॅपशॉट",
    guidanceHub: "तुमचे मार्गदर्शन केंद्र",
    exploreCosmicNetwork: "तुमच्या ब्रह्मांडीय नेटवर्कचा शोध घ्या",
    cosmicNetworkDesc: "तज्ञ मार्गदर्शकांशी संपर्क साधा, तुमची पत्रिका पहा, तुमचे बंध समजून घ्या आणि शक्तिशाली ज्योतिषीय साधनांचा वापर करा.",
    meetYourAiAstrologers: "तुमच्या AI ज्योतिष्यांना भेटा",
    linked: "✓ जोडलेले",
    celestial: "ब्रह्मांडीय",
    insights: "अंतर्दृष्टी",
    exploreAllPortals: "सर्व पोर्टल शोधा",
    viewToday: "आजचे पहा",
    rashiLibrary: "राशी लायब्ररी",
    portalChatDesc: "तुमची कुंडली, दशा, गोचर किंवा जीवन मार्गदर्शनाबद्दल काहीही विचारा.",
    portalSoulmateDesc: "गुण मिलन आणि कर्म अंतर्दृष्टी वापरून सुसज्जता जुळवा.",
    portalPulseDesc: "तुमच्या दिवसासाठी रिअल-टाइम तिथी, योग आणि वैदिक ऊर्जा.",
    portalRashiDesc: "तपशीलवार लक्षणे आणि अंतर्दृष्टीसह सर्व १२ राशी शोधा.",
    portalSessionsDesc: "थेट सत्रांमध्ये सामील व्हा आणि तज्ञ आणि साधकांशी संवाद साधा.",
    guides: {
      navi: { role: "सामान्य वैदिक मार्गदर्शक", desc: "प्रेम, काम, वेळ आणि आयुष्यासाठी संतुलित वैदिक मार्गदर्शन." },
      arya: { role: "करिअर मार्गदर्शक", desc: "नोकरी, कौशल्ये, पदोन्नती आणि कामाच्या निर्णयांसाठी मार्गदर्शन." },
      meera: { role: "नातेसंबंध मार्गदर्शक", desc: "प्रेम, विवाह, सुसंगतता आणि भावनांबद्दल अंतर्दृष्टी." },
      anand: { role: "आरोग्य सल्लागार", desc: "जीवनशक्ती, कल्याण आणि आरोग्याचे नमुने समजून घ्या." },
      vidya: { role: "आर्थिक ज्योतिषी", desc: "संपत्ती, गुंतवणूक आणि आर्थिक स्थिरतेची अंतर्दृष्टी." },
      rishi: { role: "सखोल चार्ट ऋषी", desc: "सखोल आध्यात्मिक अंतर्दृष्टीसाठी प्रगत पत्रिका विश्लेषण." },
      locked: "लॉक केलेले"
    },
    notableTransits: {
      jupiter: "गुरूचे गोचर तुमचे लाभ वाढवते आणि वाढ स्थिर करते.",
      saturn: "शनिचे गोचर तुमच्या शिस्तीची परीक्षा घेते आणि लवचिकता निर्माण करते.",
      rahu: "राहूचे गोचर जुने नमुने अस्थिर करते - जमिनीवर राहा.",
      ketu: "केतू गोष्टी सोडण्यास आणि आसक्तीमुक्त होण्यास मदत करतो."
    },
    cosmicInsight: {
      title: "दैनिक ब्रह्मांडीय अंतर्दृष्टी",
      luckyColor: "शुभ रंग",
      luckyNumber: "शुभ अंक"
    },
    deepDive: {
      title: "सखोल विश्लेषण",
      deepDiveQ1: "माझ्या साप्ताहिक अंदाजाचे तपशीलवार विश्लेषण करा",
      deepDiveQ2: "माझा {area} स्कोअर सध्याच्या पातळीवर का आहे?",
      deepDiveQ3: "माझा स्कोअर सुधारण्यासाठी मला एक जलद उपाय सांगा"
    },
    privacy: {
      protected: "तुमचा डेटा खाजगी आणि सुरक्षित आहे.",
      secure: "सुरक्षित",
      encrypted: "एन्क्रिप्टेड",
      trusted: "हजारो लोकांद्वारे विश्वासार्ह"
    },
    todaysEnergy: {
      scoreImpressive: "तुमचा {label} स्कोअर प्रभावी आहे!",
      goodTimeDesc: "महत्त्वाच्या कामांसाठी आणि निर्णयांसाठी शुभ वेळ.",
      cautionTimeDesc: "नवीन काम सुरू करणे किंवा मोठे करार करणे टाळा.",
      askNaviInChat: "चॅटमध्ये Navi ला विचारायचे?",
      askNaviConfirmDesc: "Navi या प्रश्नासह चॅट उघडेल जेणेकरून तुम्ही तिथून पुढे सुरू करू शकता.",
      stayHere: "इथेच राहा",
      openChat: "चॅट उघडा",
      explainMsg: "माझ्यासाठी आजच्या ऊर्जेचे स्पष्टीकरण द्या. माझा एकूण स्कोअर {score} आहे.",
      discussMsg: "मला माझ्या डॅशबोर्ड आणि आजच्या राशीभविष्यावर चर्चा करायची आहे."
    }
  },
  pa: {
    unlock: "ਅਨਲੌਕ",
    view: "ਦੇਖੋ",
    chartSnapshot: "ਮੇਰੀ ਕੁੰਡਲੀ ਸਨੈਪਸ਼ਾਟ",
    guidanceHub: "ਤੁਹਾਡਾ ਮਾਰਗਦਰਸ਼ਨ ਕੇਂਦਰ",
    exploreCosmicNetwork: "ਆਪਣੇ ਬ੍ਰਹਿਮੰਡੀ ਨੈਟਵਰਕ ਦੀ ਖੋਜ ਕਰੋ",
    cosmicNetworkDesc: "ਮਾਹਰ ਗਾਈਡਾਂ ਨਾਲ ਜੁੜੋ, ਆਪਣੀ ਪੱਤਰੀ ਦੀ ਖੋਜ ਕਰੋ, ਆਪਣੇ ਸਬੰਧਾਂ ਨੂੰ ਸਮਝੋ ਅਤੇ ਸ਼ਕਤੀਸ਼ਾਲੀ ਜੋਤਿਸ਼ ਸਾਧਨਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
    meetYourAiAstrologers: "ਆਪਣੇ AI ਜੋਤਸ਼ੀਆਂ ਨੂੰ ਮਿਲੋ",
    linked: "✓ ਲਿੰਕ ਕੀਤਾ",
    celestial: "ਬ੍ਰਹਿਮੰਡੀ",
    insights: "ਸੂਝ",
    exploreAllPortals: "ਸਾਰੇ ਪੋਰਟਲ ਦੇਖੋ",
    viewToday: "ਅੱਜ ਦਾ ਦੇਖੋ",
    rashiLibrary: "ਰਾਸ਼ੀ ਲਾਇਬ੍ਰੇਰੀ",
    portalChatDesc: "ਆਪਣੀ ਕੁੰਡਲੀ, ਦਸ਼ਾ, ਗੋਚਰ ਜਾਂ ਜੀਵਨ ਮਾਰਗਦਰਸ਼ਨ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।",
    portalSoulmateDesc: "ਗੁਣ ਮਿਲਾਨ ਅਤੇ ਕਰਮ ਦੀ ਸੂਝ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਅਨੁਕੂਲਤਾ ਦਾ ਮਿਲਾਨ ਕਰੋ।",
    portalPulseDesc: "ਤੁਹਾਡੇ ਦਿਨ ਲਈ ਰੀਅਲ-ਟਾਈਮ ਤਿੱਥੀ, ਯੋਗ ਅਤੇ ਵੈਦਿਕ ਊਰਜਾ।",
    portalRashiDesc: "ਵਿਸਤ੍ਰਿਤ ਲੱਛਣਾਂ ਅਤੇ ਸੂਝ ਨਾਲ ਸਾਰੇ ੧੨ ਰਾਸ਼ੀਆਂ ਦੀ ਖੋਜ ਕਰੋ।",
    portalSessionsDesc: "ਲਾਈਵ ਸੈਸ਼ਨਾਂ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ ਅਤੇ ਮਾਹਰਾਂ ਤੇ ਸਾਧਕਾਂ ਨਾਲ ਗੱਲਬਾਤ ਕਰੋ।",
    guides: {
      navi: { role: "ਆਮ ਵੈਦਿਕ ਗਾਈਡ", desc: "ਪਿਆਰ, ਕੰਮ, ਸਮੇਂ ਅਤੇ ਜੀਵਨ ਲਈ ਸੰਤੁਲਿਤ ਵੈਦਿਕ ਮਾਰਗਦਰਸ਼ਨ।" },
      arya: { role: "ਕਰੀਅਰ ਗਾਈਡ", desc: "ਨੌਕਰੀਆਂ, ਹੁਨਰ, ਤਰੱਕੀ ਅਤੇ ਕੰਮ ਦੇ ਫੈਸਲਿਆਂ ਲਈ ਮਾਰਗਦਰਸ਼ਨ।" },
      meera: { role: "ਸਬੰਧ ਗਾਈਡ", desc: "ਪਿਆਰ, ਵਿਆਹ, ਅਨੁਕੂਲਤਾ ਅਤੇ ਭਾਵਨਾਵਾਂ ਲਈ ਸੂਝ।" },
      anand: { role: "ਸਿਹਤ ਸਲਾਹਕਾਰ", desc: "ਜੀਵਨਸ਼ਕਤੀ, ਤੰਦਰੁਸਤੀ ਅਤੇ ਸਿਹਤ ਦੇ ਪੈਟਰਨਾਂ ਨੂੰ ਸਮਝੋ।" },
      vidya: { role: "ਵਿੱਤੀ ਜੋਤਸ਼ੀ", desc: "ਦੌਲਤ, ਨਿਵੇਸ਼ ਅਤੇ ਵਿੱਤੀ ਸਥਿਰਤਾ ਦੀ ਸੂਝ।" },
      rishi: { role: "ਡੂੰਘੀ ਚਾਰਟ ਰਿਸ਼ੀ", desc: "ਡੂੰਘੀ ਅਧਿਆਤਮਿਕ ਸੂਝ ਲਈ ਉੱਨਤ ਪੱਤਰੀ ਵਿਸ਼ਲੇਸ਼ਣ।" },
      locked: "ਲਾਕ ਕੀਤਾ ਹੋਇਆ"
    },
    notableTransits: {
      jupiter: "ਬ੍ਰਹਿਸਪਤੀ ਦਾ ਗੋਚਰ ਤੁਹਾਡੇ ਲਾਭ ਨੂੰ ਵਧਾਉਂਦਾ ਹੈ ਅਤੇ ਵਿਕਾਸ ਨੂੰ ਸਥਿਰ ਕਰਦਾ ਹੈ।",
      saturn: "ਸ਼ਨੀ ਦਾ ਗੋਚਰ ਤੁਹਾਡੇ ਅਨੁਸ਼ਾਸਨ ਦੀ ਪ੍ਰੀਖਿਆ ਲੈਂਦਾ ਹੈ ਅਤੇ ਲਚਕੀਲਾਪਣ ਬਣਾਉਂਦਾ ਹੈ।",
      rahu: "ਰਾਹੂ ਦਾ ਗੋਚਰ ਪੁਰਾਣੇ ਪੈਟਰਨਾਂ ਨੂੰ ਅਸਥਿਰ ਕਰਦਾ ਹੈ - ਜ਼ਮੀਨ ਨਾਲ ਜੁੜੇ ਰਹੋ।",
      ketu: "ਕੇਤੂ ਚੀਜ਼ਾਂ ਨੂੰ ਛੱਡਣ ਅਤੇ ਲਗਾਵ ਮੁਕਤ ਹੋਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।"
    },
    cosmicInsight: {
      title: "ਰੋਜ਼ਾਨਾ ਬ੍ਰਹਿਮੰਡੀ ਸੂਝ",
      luckyColor: "ਸ਼ੁਭ ਰੰਗ",
      luckyNumber: "ਸ਼ੁਭ ਅੰਕ"
    },
    deepDive: {
      title: "ਡੂੰਘਾ ਵਿਸ਼ਲੇਸ਼ਣ",
      deepDiveQ1: "ਮੇਰੇ ਹਫ਼ਤਾਵਾਰੀ ਪੂਰਵ-ਅਨੁਮਾਨ ਦਾ ਵਿਸਤਾਰ ਨਾਲ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ",
      deepDiveQ2: "ਮੇਰਾ {area} ਸਕੋਰ ਇਸਦੇ ਮੌਜੂਦਾ ਪੱਧਰ 'ਤੇ ਕਿਉਂ ਹੈ?",
      deepDiveQ3: "ਮੇਰੇ ਸਕੋਰ ਨੂੰ ਸੁਧਾਰਨ ਲਈ ਮੈਨੂੰ ਇੱਕ ਤੁਰੰਤ ਉਪਾਅ ਦੱਸੋ"
    },
    privacy: {
      protected: "ਤੁਹਾਡਾ ਡੇਟਾ ਨਿੱਜੀ ਅਤੇ ਸੁਰੱਖਿਅਤ ਹੈ।",
      secure: "ਸੁਰੱਖਿਅਤ",
      encrypted: "ਇਨਕ੍ਰਿਪਟਡ",
      trusted: "ਹਜ਼ਾਰਾਂ ਲੋਕਾਂ ਦੁਆਰਾ ਭਰੋਸੇਯੋਗ"
    },
    todaysEnergy: {
      scoreImpressive: "ਤੁਹਾਡਾ {label} ਸਕੋਰ ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਹੈ!",
      goodTimeDesc: "ਮਹੱਤਵਪੂਰਨ ਕੰਮਾਂ ਅਤੇ ਫੈਸਲਿਆਂ ਲਈ ਸ਼ੁਭ ਸਮਾਂ।",
      cautionTimeDesc: "ਨਵਾਂ ਕੰਮ ਸ਼ੁਰੂ ਕਰਨ ਜਾਂ ਵੱਡੇ ਫੈਸਲੇ ਲੈਣ ਤੋਂ ਬਚੋ।",
      askNaviInChat: "ਚੈਟ ਵਿੱਚ Navi ਨੂੰ ਪੁੱਛਣਾ ਹੈ?",
      askNaviConfirmDesc: "Navi ਇਸ ਸਵਾਲ ਨਾਲ ਚੈਟ ਖੋਲ੍ਹੇਗਾ ਤਾਂ ਜੋ ਤੁਸੀਂ ਉੱਥੋਂ ਸ਼ੁਰੂ ਕਰ ਸਕੋ।",
      stayHere: "ਇੱਥੇ ਹੀ ਰਹੋ",
      openChat: "ਚੈਟ ਖੋਲ੍ਹੋ",
      explainMsg: "ਮੇਰੇ ਲਈ ਅੱਜ ਦੀ ਊਰਜਾ ਦੀ ਵਿਆਖਿਆ ਕਰੋ। ਮੇਰਾ ਕੁੱਲ ਸਕੋਰ {score} ਹੈ।",
      discussMsg: "ਮੈਂ ਆਪਣੇ ਡੈਸ਼ਬੋਰਡ ਅਤੇ ਅੱਜ ਦੇ ਰਾਸ਼ੀਫਲ ਬਾਰੇ ਚਰਚਾ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ।"
    }
  },
  ta: {
    unlock: "அன்லாக்",
    view: "பார்",
    chartSnapshot: "எனது ஜாதகத்தின் சுருக்கம்",
    guidanceHub: "உங்கள் வழிகாட்டுதல் மையம்",
    exploreCosmicNetwork: "உங்கள் விண்வெளி நெட்வொர்க்கை ஆராயுங்கள்",
    cosmicNetworkDesc: "நிபுணர் வழிகாட்டிகளுடன் இணையுங்கள், உங்கள் ஜாதகத்தை ஆராயுங்கள், உங்கள் உறவுகளைப் புரிந்து கொள்ளுங்கள், மேலும் சக்திவாய்ந்த ஜோதிடக் கருவிகளைப் பயன்படுத்துங்கள்.",
    meetYourAiAstrologers: "உங்கள் AI ஜோதிடர்களைச் சந்தியுங்கள்",
    linked: "✓ இணைக்கப்பட்டது",
    celestial: "விண்வெளி",
    insights: "நுண்ணறிவுகள்",
    exploreAllPortals: "அனைத்து போர்ட்டல்களையும் ஆராயுங்கள்",
    viewToday: "இன்றையதை பார்க்கவும்",
    rashiLibrary: "ராசி நூலகம்",
    portalChatDesc: "உங்கள் ஜாதகம், தசா, கோச்சாரம் அல்லது வாழ்க்கை வழிகாட்டுதல் பற்றி எதையும் கேளுங்கள்.",
    portalSoulmateDesc: "குண பொருத்தம் மற்றும் கர்ம நுண்ணறிவுகளைப் பயன்படுத்தி பொருத்தத்தைப் பாருங்கள்.",
    portalPulseDesc: "உங்கள் நாளுக்கான நிகழ்நேர திதி, யோகம் மற்றும் வேத ஆற்றல்கள்.",
    portalRashiDesc: "விவரமான பண்புகளுடன் அனைத்து 12 ராசிகளையும் ஆராயுங்கள்.",
    portalSessionsDesc: "நேரடி அமர்வுகளில் பங்கேற்று, நிபுணர்கள் மற்றும் தேடுபவர்களுடன் உரையாடுங்கள்.",
    guides: {
      navi: { role: "பொது வேத வழிகாட்டி", desc: "காதல், வேலை, நேரம் மற்றும் வாழ்க்கைக்கான சமநிலையான வேத வழிகாட்டுதல்." },
      arya: { role: "தொழில் வழிகாட்டி", desc: "வேலை, திறன்கள், பதவி உயர்வு மற்றும் வேலை முடிவுகளுக்கான வழிகாட்டுதல்." },
      meera: { role: "உறவு வழிகாட்டி", desc: "காதல், திருமணம், பொருத்தம் மற்றும் உணர்வுகள் பற்றிய நுண்ணறிவுகள்." },
      anand: { role: "ആരോഗ്യ ஆலோசகர்", desc: "உடல்நலம், நல்வாழ்வு மற்றும் ஆரோக்கிய வடிவங்களைப் புரிந்து கொள்ளுங்கள்." },
      vidya: { role: "நிதி ஜோதிடர்", desc: "செல்வம், முதலீடுகள் மற்றும் நிதி நிலைத்தன்மை நுண்ணறிவுகள்." },
      rishi: { role: "ஆழமான ஜாதக முனிவர்", desc: "ஆழமான ஆன்மீக நுண்ணறிவுகளுக்கான மேம்பட்ட ஜாதக பகுப்பாய்வு." },
      locked: "பூட்டப்பட்டது"
    },
    notableTransits: {
      jupiter: "வியாழனின் கோச்சாரம் உங்கள் லாபத்தை அதிகரிக்கும் மற்றும் வளர்ச்சியை நிலைநிறுத்தும்.",
      saturn: "சனியின் கோச்சாரம் உங்கள் ஒழுக்கத்தை சோதித்து நெகிழ்ச்சியை உருவாக்கும்.",
      rahu: "ராகுவின் கோச்சாரம் பழைய வடிவங்களை சீர்குலைக்கும் - விழிப்புடன் இருங்கள்.",
      ketu: "கேது விஷயங்களை விட்டுவிடுவதற்கும் பற்றுக்களைத் துறப்பதற்கும் உதவுகிறது."
    },
    cosmicInsight: {
      title: "தினசரி விண்வெளி நுண்ணறிவு",
      luckyColor: "அதிர்ஷ்ட நிறம்",
      luckyNumber: "அதிர்ஷ்ட எண்"
    },
    deepDive: {
      title: "ஆழமான பகுப்பாய்வு",
      deepDiveQ1: "எனது வாராந்திர கணிப்பை விரிவாக பகுப்பாய்வு செய்யவும்",
      deepDiveQ2: "எனது {area} மதிப்பெண் தற்போதைய நிலையில் இருப்பது ஏன்?",
      deepDiveQ3: "எனது மதிப்பெண்ணை மேம்படுத்த ஒரு விரைவான வழியைக் கூறுங்கள்"
    },
    privacy: {
      protected: "உங்கள் தரவு தனிப்பட்டது மற்றும் பாதுகாப்பானது.",
      secure: "பாதுகாப்பானது",
      encrypted: "மறைக்குறியாக்கப்பட்டது",
      trusted: "ஆயிரக்கணக்கானோரால் நம்பப்படுகிறது"
    },
    todaysEnergy: {
      scoreImpressive: "உங்களது {label} மதிப்பெண் சிறப்பாக உள்ளது!",
      goodTimeDesc: "முக்கியமான வேலைகள் மற்றும் முடிவுகளுக்கு சாதகமான நேரம்.",
      cautionTimeDesc: "புதிய வேலைகளைத் தொடங்குவதையோ முக்கியமான ஒப்பந்தங்களையோ தவிர்க்கவும்.",
      askNaviInChat: "அரட்டையில் Naviயிடம் கேட்கலாமா?",
      askNaviConfirmDesc: "அங்கிருந்து தொடர இந்த கேள்வியுடன் Navi அரட்டை சாளரத்தைத் திறக்கும்.",
      stayHere: "இங்கேயே இருங்கள்",
      openChat: "அரட்டையைத் திறக்கவும்",
      explainMsg: "இன்றைய ஆற்றலைப் பற்றி விளக்குங்கள். எனது ஒட்டுமொத்த மதிப்பெண் {score} ஆகும்.",
      discussMsg: "எனது டாஷ்போர்டு மற்றும் இன்றைய ராசிபலனைப் பற்றி விவாதிக்க விரும்புகிறேன்."
    }
  },
  te: {
    unlock: "అన్‌లాక్",
    view: "చూడండి",
    chartSnapshot: "నా జాతకం స్నాప్‌షాట్",
    guidanceHub: "మీ మార్గదర్శక కేంద్రం",
    exploreCosmicNetwork: "మీ విశ్వ నెట్‌వర్క్‌ను అన్వేషించండి",
    cosmicNetworkDesc: "నిపుణులైన గైడ్‌లతో కనెక్ట్ అవ్వండి, మీ చార్ట్‌ను అన్వేషించండి, మీ బంధాలను అర్థం చేసుకోండి మరియు శక్తివంతమైన జ్యోతిష్య సాధనాలను యాక్సెస్ చేయండి.",
    meetYourAiAstrologers: "మీ AI జ్యోతిష్యులను కలవండి",
    linked: "✓ లింక్ చేయబడింది",
    celestial: "విశ్వ",
    insights: "అంతర్దృష్టులు",
    exploreAllPortals: "అన్ని పోర్టల్‌లను అన్వేషించండి",
    viewToday: "ఇవాల్టి చూడండి",
    rashiLibrary: "రాశి లైబ్రరీ",
    portalChatDesc: "మీ జాతకం, దశలు, గోచారం లేదా జీవిత మార్గదర్శకత్వం గురించి ఏదైనా అడగండి.",
    portalSoulmateDesc: "గుణ మిలన్ మరియు కర్మ అంతర్దృష్టులను ఉపయోగించి అనుకూలతను సరిపోల్చండి.",
    portalPulseDesc: "మీ రోజు కోసం నిజ-సమయ తిథి, యోగం మరియు వైదిక శక్తులు.",
    portalRashiDesc: "వివరణాత్మక లక్షణాలు మరియు అంతర్దృష్టులతో మొత్తం 12 రాశులను అన్వేషించండి.",
    portalSessionsDesc: "లైవ్ సెషన్లలో పాల్గొనండి మరియు నిపుణులు మరియు అన్వేషకులతో సంప్రదించండి.",
    guides: {
      navi: { role: "సాధారణ వైదిక గైడ్", desc: "ప్రేమ, పని, సమయం మరియు జీవితం కోసం సమతుల్య వైదిక మార్గదర్శకత్వం." },
      arya: { role: "కెరీర్ మార్గదర్శి", desc: "ఉద్యోగాలు, నైపుణ్యాలు, పదోన్నతి మరియు పని నిర్ణయాల కోసం మార్గదర్శకత్వం." },
      meera: { role: "సంబంధాల గైడ్", desc: "ప్రేమ, వివాహం, అనుకూలత మరియు భావోద్వేగాల అంతర్దృష్టులు." },
      anand: { role: "ఆరోగ్య సలహాదారు", desc: "జీవశక్తి, శ్రేయస్సు మరియు ఆరోగ్య నమూనాలను అర్థం చేసుకోండి." },
      vidya: { role: "ఆర్థిక జ్యోతిష్యుడు", desc: "సంపద, పెట్టుబడులు మరియు ఆర్థిక స్థిరత్వం అంతర్దృష్టులు." },
      rishi: { role: "లోతైన చార్ట్ ముని", desc: "లోతైన ఆధ్యాత్మిక అంతర్దృష్టుల కోసం అధునాతన జాతక విశ్లేషణ." },
      locked: "లాక్ చేయబడింది"
    },
    notableTransits: {
      jupiter: "గురు గోచారం మీ లాభాలను పెంచుతుంది మరియు వృద్ధిని స్థిరపరుస్తుంది.",
      saturn: "శని గోచారం మీ క్రమశిక్షణను పరీక్షిస్తుంది మరియు స్థితిస్థాపకతను పెంచుతుంది.",
      rahu: "రాహు గోచారం పాత నమూనాలను అస్థిరపరుస్తుంది - అప్రమత్తంగా ఉండండి.",
      ketu: "కేతువు విషయాలను వదిలివేయడానికి మరియు వైరాగ్యం పొందడానికి సహాయపడుతుంది."
    },
    cosmicInsight: {
      title: "రోజువారీ విశ్వ అంతర్దృష్టి",
      luckyColor: "శుభ రంగు",
      luckyNumber: "శుభ సంఖ్య"
    },
    deepDive: {
      title: "లోతైన విశ్లేషణ",
      deepDiveQ1: "నా వారపు సూచనను వివరంగా విశ్లేషించండి",
      deepDiveQ2: "నా {area} స్కోరు ప్రస్తుత స్థాయిలో ఎందుకు ఉంది?",
      deepDiveQ3: "నా స్కోరును మెరుగుపరచడానికి నాకు శీఘ్ర నివారణ చెప్పండి"
    },
    privacy: {
      protected: "మీ డేటా ప్రైవేట్ మరియు సురక్షితం.",
      secure: "సురక్షితం",
      encrypted: "ఎన్‌క్రిప్ట్ చేయబడింది",
      trusted: "వేలాది మంది విశ్వసించారు"
    },
    todaysEnergy: {
      scoreImpressive: "మీ {label} స్కోరు అద్భుతంగా ఉంది!",
      goodTimeDesc: "ముఖ్యమైన పనులు మరియు నిర్ణయాలకు అనుకూలమైన సమయం.",
      cautionTimeDesc: "కొత్త పనులను ప్రారంభించడం లేదా పెద్ద ఒప్పందాలను నివారించండి.",
      askNaviInChat: "చాట్‌లో Naviని అడగాలా?",
      askNaviConfirmDesc: "అక్కడి నుండి కొనసాగడానికి ఈ ప్రశ్నతో Navi చాట్ విండోను తెరుస్తుంది.",
      stayHere: "ఇక్కడే ఉండండి",
      openChat: "చాట్ తెరవండి",
      explainMsg: "నా కోసం ఇవాల్టి శక్తిని వివరించండి. నా మొత్తం స్కోరు {score} ఉంది.",
      discussMsg: "నేను నా డ్యాష్‌బోర్డ్ మరియు ఇవాల్టి రాశిఫలం గురించి చర్చించాలనుకుంటున్నాను."
    }
  }
};

// List of supported locales
const locales = ['en', 'hi', 'bn', 'gu', 'kn', 'ko', 'ml', 'mr', 'pa', 'ta', 'te'];

locales.forEach(loc => {
  const filePath = path.join(localesDir, `${loc}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Locales] File not found: ${filePath}`);
    return;
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);

    // 1. Inject root paywall translations
    json.paywall = paywallTranslations[loc] || paywallTranslations['en'];

    // 2. Setup/Fix newDashboard block
    if (!json.newDashboard) {
      json.newDashboard = {};
    }

    // 3. Inject new/missing newDashboard keys if we have local definitions (non-English / non-Hindi)
    const localDashboardKeys = missingDashboardKeys[loc];
    if (localDashboardKeys) {
      // Merge keys at newDashboard root
      Object.keys(localDashboardKeys).forEach(key => {
        if (typeof localDashboardKeys[key] === 'object' && localDashboardKeys[key] !== null) {
          if (!json.newDashboard[key]) {
            json.newDashboard[key] = {};
          }
          json.newDashboard[key] = {
            ...json.newDashboard[key],
            ...localDashboardKeys[key]
          };
        } else {
          json.newDashboard[key] = localDashboardKeys[key];
        }
      });
    }

    // 4. Specifically ensure hi/en get unlock, view, and chartSnapshot keys under newDashboard root
    if (loc === 'en') {
      json.newDashboard.unlock = "Unlock";
      json.newDashboard.view = "View";
      json.newDashboard.chartSnapshot = "My Chart Snapshot";
    } else if (loc === 'hi') {
      json.newDashboard.unlock = "अनलॉक";
      json.newDashboard.view = "देखें";
      json.newDashboard.chartSnapshot = "मेरी कुंडली स्नैपशॉट";
    }

    // Save formatted back to file
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`[Locales] Successfully updated ${loc}.json`);
  } catch (err) {
    console.error(`[Locales] Error updating ${loc}.json:`, err);
  }
});
