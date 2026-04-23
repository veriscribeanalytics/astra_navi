import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
    Sparkles, BookOpen, User, Calendar, 
    Clock, MapPin, ArrowRight 
} from 'lucide-react';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';

const Hero = () => {
    const router = useRouter();
    const { isLoggedIn, user } = useAuth();
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: "easeOut" as const }
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });
    const [touched, setTouched] = useState({
        name: false,
        dob: false,
        tob: false,
        pob: false
    });

    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';
        
        switch (field) {
            case 'name':
                if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                } else if (value.trim().length > 50) {
                    error = 'Name is too long';
                } else if (!/^[a-zA-Z\s]+$/.test(value)) {
                    error = 'Name can only contain letters';
                }
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    const today = new Date();
                    const hundredYearsAgo = new Date();
                    hundredYearsAgo.setFullYear(today.getFullYear() - 120);

                    if (dob > today) {
                        error = 'Birth date cannot be in the future';
                    } else if (dob < hundredYearsAgo) {
                        error = 'Please enter a valid birth date';
                    }
                }
                break;
            case 'pob':
                if (value.trim().length < 2) {
                    error = 'Please enter a valid place';
                } else if (value.trim().length > 100) {
                    error = 'Place name is too long';
                }
                break;
        }
        
        return error;
    };

    const validateForm = () => {
        const newErrors = {
            name: validateField('name', formData.name),
            dob: validateField('dob', formData.dob),
            tob: '',
            pob: validateField('pob', formData.pob)
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Save to local storage to "Claim" after login/register
        if (typeof window !== 'undefined') {
            localStorage.setItem('astranavi_pending_birth_details', JSON.stringify(formData));
        }
        
        // Redirect to login/register to finish the journey
        router.push('/chat');
    };

    return (
        <section className="relative min-h-[500px] sm:min-h-[550px] md:min-h-[600px] lg:min-h-[650px] flex items-center px-4 sm:px-6 md:px-8 lg:px-12 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-10 md:pb-12 lg:pb-14 overflow-hidden">
            {/* Background glowing orbs - Now Animated */}
            <motion.div 
                initial={{ opacity: 0.1, scale: 0.8 }}
                animate={{ 
                    opacity: [0.3, 0.5, 0.3],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" as const }}
                className="absolute top-[-10%] right-[-10%] w-[250px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[250px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-[var(--glow-color)] blur-[60px] sm:blur-[80px] md:blur-[100px] lg:blur-[120px] rounded-full -z-10 opacity-30 dark:opacity-60"
            ></motion.div>
            
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 xl:gap-20 items-center relative z-10">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 text-center lg:text-left"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-1.5 md:py-2 rounded-full bg-secondary/10 border border-secondary/30">
                        <Sparkles className="text-secondary w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[12px] sm:text-[13px] md:text-[14px] uppercase tracking-[0.12em] sm:tracking-[0.13em] md:tracking-[0.15em] font-bold text-secondary font-body">Jyotish Shastra • Vedic Astrology</span>
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants} className="text-[28px] leading-[1.15] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-headline font-bold text-primary">
                        The Cosmos Spoke<br/>At Your <span className="text-secondary italic drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]">Birth</span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed font-normal font-body mx-auto lg:mx-0">
                        For 5,000 years, Jyotish has mapped human destiny through planetary positions. Enter your birth details and receive your complete Kundli—revealing your soul's journey, karmic patterns, and the precise timing of life's major events.
                    </motion.p>
                    
                    <motion.div variants={itemVariants} className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-5 md:gap-8 lg:gap-10 py-2 sm:py-3 md:py-4 lg:py-5">
                        <div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-secondary font-body">Always</div>
                            <div className="text-[12px] sm:text-[13px] uppercase tracking-widest text-on-surface-variant font-bold font-body">Available</div>
                        </div>
                        <div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary font-body">Complete</div>
                            <div className="text-[12px] sm:text-[13px] uppercase tracking-widest text-on-surface-variant font-bold font-body">Birth Chart</div>
                        </div>
                        <div>
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary font-body">Sacred</div>
                            <div className="text-[12px] sm:text-[13px] uppercase tracking-widest text-on-surface-variant font-bold font-body">Privacy</div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Kundli Widget / Welcome Back Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" as const }}
                >
                    <Card 
                      className="border-secondary/30 min-h-[280px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[380px] flex flex-col justify-center !bg-surface hover:shadow-2xl hover:shadow-secondary/5 transition-shadow duration-500"
                      padding="md"
                    >
                    {isLoggedIn && user?.name ? (
                        <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 py-2 sm:py-3 md:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-6">
                                <span className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-headline font-bold text-secondary">
                                    {(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}
                                </span>
                             </div>
                             
                             <div className="space-y-1.5 sm:space-y-2">
                                <h3 className="text-[12px] sm:text-[13px] md:text-sm font-body font-bold text-secondary tracking-widest uppercase mb-1">Namaste</h3>
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-headline font-bold text-primary">Welcome back, {user?.name.split(' ')[0]}</h2>
                                <p className="text-xs sm:text-sm text-on-surface-variant font-body">Your Dashas continue to unfold. The planets have shifted since your last visit.</p>
                             </div>

                             <div className="pt-3 sm:pt-4 md:pt-5 lg:pt-6">
                                <Button 
                                    href="/chat"
                                    fullWidth
                                    size="lg"
                                    className="shadow-lg shadow-secondary/20"
                                >
                                    Consult Navi
                                </Button>
                                <p className="mt-2.5 sm:mt-3 md:mt-3.5 lg:mt-4 text-[12px] sm:text-[13px] uppercase tracking-widest text-on-surface-variant/60 font-bold font-body">
                                    Born: {user?.dob} • {user?.pob}
                                </p>
                             </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-headline font-bold mb-4 sm:mb-5 md:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-2.5 md:gap-3 text-primary">
                                <BookOpen className="text-secondary w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                                Reveal Your Kundli
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 md:space-y-5 lg:space-y-6">
                                <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6">
                                    <Input 
                                        label="Full Name"
                                        placeholder="Enter your full name" 
                                        type="text"
                                        icon={<User className="w-4 h-4" />}
                                        value={formData.name}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData({...formData, name: value});
                                            if (touched.name) {
                                                setErrors({...errors, name: validateField('name', value)});
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched({...touched, name: true});
                                            setErrors({...errors, name: validateField('name', formData.name)});
                                        }}
                                        error={touched.name ? errors.name : ''}
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6">
                                    <Input 
                                        label="Date of Birth"
                                        type="date"
                                        icon={<Calendar className="w-4 h-4" />}
                                        value={formData.dob}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData({...formData, dob: value});
                                            if (touched.dob) {
                                                setErrors({...errors, dob: validateField('dob', value)});
                                            }
                                        }}
                                        onBlur={() => {
                                            setTouched({...touched, dob: true});
                                            setErrors({...errors, dob: validateField('dob', formData.dob)});
                                        }}
                                        error={touched.dob ? errors.dob : ''}
                                        helperText="Your birth date for accurate chart"
                                        required
                                    />
                                    <Input 
                                        label="Time of Birth"
                                        type="time"
                                        icon={<Clock className="w-4 h-4" />}
                                        value={formData.tob}
                                        onChange={(e) => setFormData({...formData, tob: e.target.value})}
                                        helperText="Exact time for precise predictions"
                                        required
                                    />
                                </div>
                                
                                <Input 
                                    label="Place of Birth"
                                    placeholder="City, Country" 
                                    type="text"
                                    icon={<MapPin className="w-4 h-4" />}
                                    value={formData.pob}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData({...formData, pob: value});
                                        if (touched.pob) {
                                            setErrors({...errors, pob: validateField('pob', value)});
                                        }
                                    }}
                                    onBlur={() => {
                                        setTouched({...touched, pob: true});
                                        setErrors({...errors, pob: validateField('pob', formData.pob)});
                                    }}
                                    error={touched.pob ? errors.pob : ''}
                                    helperText="City and country of birth"
                                    required
                                />
                                
                                <Button 
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                    rightIcon={<ArrowRight className="w-4 h-4" />}
                                >
                                    Calculate My Chart
                                </Button>
                            </form>
                        </>
                    )}
                </Card>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
