import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const rashiItems = [
    { id: 'aries', name: 'Mesh', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8ckpFhxKrbaPuYEdxXzCk6mWJqeg-mFXapKG1VNsC9N5ktqs4Teixo6kWlK5CatPxDA-ZUzJluZdxEKP1m2hpJaU5BwE6DhXs-6wTQKkgC2Wm1dPahL4ItJRKV7Oy3GZPBwaby8lghtRgO2MNv2G1LGlgLvnBeCA8gbFPYUMIEWQ0x1SWMQEF8erY-582i2eT0jeboEE-qAQslnq1PeZ28e9NxHL_eH17HqM37zIGiYF4cXRju5pi5eDhU274G9Du3usPuhLWhbMz' },
    { id: 'taurus', name: 'Vrish', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1bmHVlgxW1Zm-hHjPqyXBlAl_qAuVSynQmhuh24tdlOtpW02R8EuPn6CiAVs1gWgkijGv2rYNNpgQdx81ATGNGzW9BuzPxyj9oSHvj4cHS_u-B5bJ0Ts2nfJYSQ4g2eR7RvlxmwoMm8dqT2WG72DbUfZxMS5s4uq_oPb13upSVZa0HReGNYDvzbZUkYOTV3YD8VRBDOUa_uQuq9USV-G_qfvQbCsvWPKdbH-0GZUE6POmQMTI5othvfm4tzL-ysDDT5Q-RciSa1zA' },
    { id: 'gemini', name: 'Mithun', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlQwleMO0M70i4NoSNvWF_rR6fbVrBcmJYBJamCJNqDYnjYqDCOxT0wSOciYVu5L5GJIUpajFsV8H4FOrcFppVsTNfibiuW0rAr597KTBrEJam4A-nAoFQ-CdpcyL5YBXYytFHC7oDDJnDB8-L9dqVBxnkQJsPsieKgzoL1JZEWpwOoloPEkbaVcRdhO-IjrZp5_xSfZWEckqJ64Ew0vJuWuyk6AjlKWu5dvuc4bxYTLRds0CGvKY5m0BFRuYyhNo1HKuov5p5es64' },
    { id: 'cancer', name: 'Kark', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVhKBFntTmp8n6MOkM4OdWWJkuCS-jU8zBRbL9AQt98trZbJ4saTsjoTq96wrE2pEc_OdSzlVbMyIZgzpubMPctBUKgHuqlP9p6vEgMSc1HSiF91xSZR9yT4YDJbDO4Do8jPqTc9rhXSPJUW8Hx7DVB78YFY0cbQ63Md1Jj7O2GWNhf4wdtGKEzr6dTTAsxe5T27ynKWCChGiWT7HWqQzOnr5HMhMDypHLJrCsFRnqIqV8RxG2mODXSuALkCaWqfHdcgcqMR7afZnJ' },
    { id: 'leo', name: 'Simha', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB8kI-VCwnsgWmWFnTyqyddH7HskqWGbs9ZdDapH6KQ_OTiggklDxnMnftF0OO22ybck1x-qDsxu6UZ9cvb1jOVSR9ABiISQGmyBRTieAwXI9obnsYhfisY3wkqcRT-1hbIE5k2t8VDIP7nTlxzueKaHt_vFdpDsA_l9uq9YkK709QbSFn9AJYwphzI8p-12UiAcuNMG3T6VY9c7zrZLhlQ-KqmStDknwkusJtmFEIBWfY5iqTDbKmAE0sFbW8-wx-MMPNv5h3RbY8' },
    { id: 'virgo', name: 'Kanya', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_o_AJmgC2oG3VXWmf0ErlWqZuF6DHrxYfv5cA2clSXBM1ONrxAwOVcT-8G0VU8PICqnHuCLkV5eS_yRrxxC2LyjHC47MiiJ7p3xUkqqyA7vSJzSv_fuI0Ras_6u9-RTcEi6uXQ2NCQz1tOj4PPVmdXXijDPY3JVMm-HzHzhBbzguy_BbJegnvX9JPjhX49hkqCWiZUXtKaxu40xO-iphhLSgHpOGKT2ZJT04B5na1WafxtrFuLswq7bc6lQfjg4ZH2A5MUt8C-CJd' },
    { id: 'libra', name: 'Tula', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_N78nWmeyk5WI5UyusRoVNbaSVWtH9MogrQTR9egfe7m4CAOfuvkEbkhvscOTCt2exZKnRwcs1zvLjjKh7fnBIIwh6p6z1rXKSozeGqXrOaKGhD4oXER1WErCFg0zmJiLCViMVFu4GdnVzPYHDsn3yaH6sjet9VK_wrYMfhDq-1n7t9_B8nc2s5SA13717YXpa8QMJaMK8re-r53UEPzvskmbf8YY02aNSY6Ksae3YmZsXFv_YmYF5lvWi_FWNIVPfhibiWFg_mLC' },
    { id: 'scorpio', name: 'Vrishchik', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsI-VUTM_vzm7KraBGTXgNw4TcjhpxAU-rMRdGaiSi1nObba18figyOZ9J2FBCBeUCqf-kAr5lQ_vqfSY9fw9t9mnuUAs1Qbm75HIMRLPMSN_9M0taoOJ89RbUSKvubW84kM8AaJiZBDNqoaS_YjxJ30Sxlw6CyfhOMlSNp5eIUWF6jjjEmYPRIn6RYGyKVAMvl8Aw-1oUM8olwPD98ifuxCDbbU8Ey0wQKFkrKk3r01xmnJz7EZcy-cjXUWyYfCMAN_Y8y8o9VPB1' },
    { id: 'sagittarius', name: 'Dhanu', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEbrvUCsGBlij8EsNbRaWCkiWYAP_ZjqsYYzmpxUEWp2g8iBxrNA-iOpHSaAA68gfuTbCv9BVUrd-HtX5BPVyhAGCBaS5EHskNYxNLKTZoo91VJ2dV8qG-b7BoSZz43fy0nM6t4zJZ47IVAXMu9K3JT7W3L8pBfyBYrZVouLVVi-rt8z4Y_tqUi95ThGMIHhmxY3Uu2-447etI7P2oIdqEhIkj69Ms8iIQMypvPWIkbgyz4Hr9E0G5uA4A4r1Zwif_yA1nVdUsbuj7' },
    { id: 'capricorn', name: 'Makar', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn_hnk72AOw4sHV9_AyjLd0OT5d77TdoEXnL0d0PUBKvP5dX1-mw9mbIB8NfhLheck8Tu4dvQs9PYM6oUddjGkXzREjBhB6sE5mTb3wVqZX2bXzOU7Lyiv-9gV3Ah0TWHvDcp_77OfQvOpG-smUtQTFirp79Tajdctb72r9_oiqLDJh9lz3qGl3jDovIdeHYfHCBNRiYySB9QR1W1BJ-UzQty6vvVj2YifiNgJQZRhs8WcEyxemCIk2DGchkZGGHdopNUvwfjev8fx' },
    { id: 'aquarius', name: 'Kumbh', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbhwbhVm1fkSRsXHEI2JUtwxgnLvnn2VlLFls_Lnz5GKkiPSz6rN5Vc1Ye6QNonovaMChsz6FIRqi9gNbucfEtv3Bw61mmXDsyGTUkljauIjX2y8s3882KNC-lg-GtwWnjI5ZoYRNrsrduvbeDeh6_CwZ5JWBrbLh15KAV7C7mmdmA-21Xxmmbjr9k2dDNzolzzxoY5nuuQJJItIClpfrgb44dkZ_7-9zY1t6fwcDM0xsvbPJ-AQCyw7-yNW7FJraUVXFVF-SjrhqQ' },
    { id: 'pisces', name: 'Meen', icon: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8Q6hdfIyws-P56S0b1MiF8zkStFewla-Lm7VqKjFPA29JiVlD6s8kL-YTF7tgUJSWbHh5EEuaqllyYvJfRQEuCJQB8cSBLEEjwCQwg0djTCDtOHkfGMcU8hhpEt99cu5uzRIpFp-p3qrOcj7FoY9FWeaVtqsNjVYfBlLQitnlUg0WJFeqc3uus7DGGT_L56IGSVr7B8ly_sX8ToidFs4YuX8eSRpZeX15iYlqtzJn1qj8AZSOiP7pKpVhwqIpGt0SLeyG_UxhGdQJ' },
];

const ZodiacStrip = () => {
    return (
        <section className="bg-transparent border border-secondary/20 backdrop-blur-sm relative overflow-hidden h-[44px] sm:h-[52px] flex items-center mx-3 sm:mx-8 lg:mx-12 rounded-[12px] sm:rounded-[16px] mt-6 sm:mt-8 mb-3 sm:mb-4">
            <div className="w-full flex space-x-6 sm:space-x-10 px-4 sm:px-6 overflow-x-auto custom-scrollbar whitespace-nowrap items-center h-full hide-scrollbar">
                {rashiItems.map((rashi) => (
                    <div 
                        key={rashi.id}
                        className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer transition-colors text-foreground/60 hover:text-foreground font-medium"
                    >
                        <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0">
                            <img 
                                alt={`${rashi.name} Icon`} 
                                className="w-full h-full object-contain transition-all opacity-40 group-hover:opacity-100 grayscale group-hover:grayscale-0" 
                                src={rashi.icon}
                            />
                        </div>
                        <span className="text-[9px] sm:text-[11px] uppercase tracking-widest shrink-0">
                            {rashi.name}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ZodiacStrip;
