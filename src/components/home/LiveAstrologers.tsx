import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const LiveAstrologers = () => {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                {/* Left: Live Astrologers */}
                <div className="lg:w-2/3 space-y-12">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold text-primary">Live Now - Top Astrologers</h2>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-lg shadow-red-500/50"></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest text-primary/60">AI Experts Online</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Expert Card 1 */}
                        <Card className="group cosmic-glow border-secondary/5">
                            <div className="flex gap-6 mb-6">
                                <div className="relative">
                                    <img alt="Pandit Ramesh" className="w-24 h-24 rounded-2xl object-cover grayscale-0 group-hover:scale-105 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBffjRi1gTxrhuVoPTWj13LQVUS12CzHUL31aSTFOJnMOXkHC1J1qIoDwtRYxFcGp_w5Pd0pIkqNnOBVMg9-h5zg8P0US___t28LjcUwLvie6kFe4tedRQuJfMTmuMNxWdW1-MRwv_NCbYS7mJkEAmSh5Yq8I_XbLh2TiX7UqbNvVXgTQqYTnwrBp9p5zYJGCFEHkZMq1bsgd879gcXBAbmGvi1fl6MOi56GqI5bBVnbddX0QsW_VpkU5gVw4eNvMhCoOqBVPz2vDGM" />
                                    <div className="absolute -bottom-2 -right-2 bg-primary px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-lg">EXP 15YRS</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-xl font-headline font-bold text-primary">Pandit Ramesh Sharma</h4>
                                        <div className="flex items-center gap-1 text-secondary">
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-sm font-bold">4.9</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-on-surface-variant font-medium mb-2">Vedic, Vastu, Palmistry</p>
                                    <div className="text-lg font-bold text-secondary">₹35<span className="text-[10px] text-primary/40 font-normal uppercase ml-1">/min</span></div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" fullWidth className="gap-2">
                                    <span className="material-symbols-outlined text-lg">call</span> Call
                                </Button>
                                <Button variant="primary" fullWidth className="gap-2 shadow-lg shadow-secondary/10">
                                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span> Chat Now
                                </Button>
                            </div>
                        </Card>

                        {/* Expert Card 2 */}
                        <Card className="group cosmic-glow border-secondary/5">
                            <div className="flex gap-6 mb-6">
                                <div className="relative">
                                    <img alt="Sadhvi Ananya" className="w-24 h-24 rounded-2xl object-cover grayscale-0 group-hover:scale-105 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs0k6_TJsZn5qjuMooZKe1GyBFUK_SAIfq_a5wWLv9WkebJuoU8fIBR5vk9-V9yYxEnkiQsBxAiP8KYp4D0jq0qgodo32GeYlJsMfxygAc-LVPzrYMus_-04CY6-gvqyh6_btzDO8FzPNHnoEfLV3aGzaO_6EbpDznKyxzDQ5EbD9kuxdBs9djGF-3b73tJDis5nPOlKPbZBkrkByTJqEVAVHW1Mxf_LmrDAt85cRZej96Ej6C_PVf5oDSLvihJ61veQ-G_ACALtvj" />
                                    <div className="absolute -bottom-2 -right-2 bg-primary px-2 py-1 rounded-lg text-[10px] font-bold text-white shadow-lg">EXP 8YRS</div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-xl font-headline font-bold text-primary">Sadhvi Ananya Devi</h4>
                                        <div className="flex items-center gap-1 text-secondary">
                                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-sm font-bold">5.0</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-primary/60 font-medium mb-2">KP System, Nadi, Face Reading</p>
                                    <div className="text-lg font-bold text-secondary">₹45<span className="text-[10px] text-primary/40 font-normal uppercase ml-1">/min</span></div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="secondary" fullWidth className="gap-2">
                                    <span className="material-symbols-outlined text-lg">call</span> Call
                                </Button>
                                <Button variant="primary" fullWidth className="gap-2 shadow-lg shadow-secondary/10">
                                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span> Chat Now
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Vedic Remedies Section */}
                    <Card
                        variant="default"
                        padding="lg"
                        className="bg-surface border border-secondary/10 shadow-sm cosmic-glow"
                    /*hoverable={false}*/
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined">auto_fix_high</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-headline font-bold text-primary">Weekly Planetary Remedies</h3>
                                <p className="text-sm text-primary/60 font-medium">Align your actions with celestial movements</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                            <Card padding="md" className="bg-surface border-l-4 border-secondary shadow-sm hover:shadow-md transition-shadow" hoverable={false}>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Monday: Moon</div>
                                <p className="text-sm text-on-surface font-medium leading-relaxed">Offer milk and water to Lord Shiva for emotional stability and mental peace.</p>
                            </Card>
                            <Card padding="md" className="bg-surface/40 border-l-4 border-primary/20 opacity-70" hoverable={false}>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-2">Tuesday: Mars</div>
                                <p className="text-sm text-on-surface leading-relaxed">Recite Hanuman Chalisa to channel energy and overcome obstacles.</p>
                            </Card>
                            <Card padding="md" className="bg-surface/40 border-l-4 border-primary/20 opacity-70" hoverable={false}>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 mb-2">Wednesday: Mercury</div>
                                <p className="text-sm text-on-surface leading-relaxed">Offer green grass to cows to enhance communication and intellectual growth.</p>
                            </Card>
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <aside className="lg:w-1/3 space-y-8">
                    {/* Today's Reading Card */}
                    <Card
                        variant="default"
                        padding="md"
                        className="bg-surface-variant/40"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-headline font-bold text-primary">Vrishchika Today</h3>
                            <span className="material-symbols-outlined text-secondary">psychology_alt</span>
                        </div>
                        <div className="space-y-4 mb-8">
                            <p className="text-sm text-primary/80 leading-relaxed font-medium">
                                A period of transformation awaits. The Moon's alignment suggests unexpected financial gains through past investments. Focus on throat chakra today.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Card padding="sm" className="bg-surface text-center border-secondary/5 rounded-2xl" hoverable={false}>
                                    <div className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Lucky No.</div>
                                    <div className="text-xl font-bold text-secondary">8</div>
                                </Card>
                                <Card padding="sm" className="bg-surface text-center border-secondary/5 rounded-2xl" hoverable={false}>
                                    <div className="text-[10px] uppercase font-bold text-on-surface-variant/60 mb-1">Lucky Color</div>
                                    <div className="text-xl font-bold text-secondary">Maroon</div>
                                </Card>
                            </div>
                        </div>
                        <hr className="border-secondary/10 mb-8" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Planetary Transits</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between">
                                <span className="text-sm text-primary/70 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs text-secondary">light_mode</span> Sun in Meena
                                </span>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-secondary/10 text-secondary uppercase">Transit</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-sm text-primary/70 font-medium flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs text-primary">night_sight_auto</span> Moon in Vrishchika
                                </span>
                                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/5 text-primary uppercase">Today</span>
                            </li>
                        </ul>
                    </Card>

                    {/* Daily Panchang */}
                    <Card
                        padding="md"
                        className="bg-surface text-on-surface shadow-xl shadow-surface/20 space-y-6 cosmic-glow"
                    >
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-secondary">brightness_5</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">Celestial Insights</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-sm font-bold">Tithi</span>
                                <span className="text-sm font-bold text-secondary">Shukla Navami</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-sm font-bold">Nakshatra</span>
                                <span className="text-sm font-bold text-secondary">Anuradha</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-sm font-bold">Yoga</span>
                                <span className="text-sm font-bold text-secondary">Saubhagya</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-sm font-bold">Rahukaal</span>
                                <span className="text-sm font-bold text-red-300">10:30 - 12:00</span>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>
        </section>
    );
};

export default LiveAstrologers;
