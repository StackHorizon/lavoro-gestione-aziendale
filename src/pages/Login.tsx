import React, {useState, useEffect, useRef} from 'react';
    import {useAuth} from '@/contexts/AuthContext';
    import {useNavigate} from 'react-router-dom';
    import {Button} from '@/components/ui/button';
    import {Input} from '@/components/ui/input';
    import {Label} from '@/components/ui/label';
    import {Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
    import {AlertCircle, Building2, Mail, KeyRound, ArrowRight, Lock, Eye, EyeOff} from 'lucide-react';
    import {Alert, AlertDescription} from '@/components/ui/alert';
    import gsap from 'gsap';

    const Login = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const {login, isAuthenticated} = useAuth();
        const navigate = useNavigate();

        // Refs per animazioni GSAP
        const containerRef = useRef<HTMLDivElement>(null);
        const cardRef = useRef<HTMLDivElement>(null);
        const titleRef = useRef<HTMLHeadingElement>(null);
        const formRef = useRef<HTMLFormElement>(null);

        useEffect(() => {
            if (isAuthenticated) {
                navigate('/clienti');
            }
        }, [isAuthenticated, navigate]);

        useEffect(() => {
            // Animazioni all'avvio
            if (containerRef.current && cardRef.current && titleRef.current && formRef.current) {
                // Timeline principale
                const tl = gsap.timeline();

                // Inizializza gli elementi fuori dallo schermo
                gsap.set(cardRef.current, {y: 50, opacity: 0});
                gsap.set(formRef.current.children, {y: 10, opacity: 0});

                // Animazione della card
                tl.to(cardRef.current, {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power2.out"
                }, 0.3);

                // Animazione sequenziale degli elementi del form
                tl.to(formRef.current.children, {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power2.out"
                }, 0.8);
            }

            // Cleanup
            return () => {
                gsap.killTweensOf('*');
            };
        }, []); // Dipendenze vuote per eseguire solo al montaggio

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setIsLoading(true);

            // Animazione del pulsante al click - più sottile
            if (e.currentTarget) {
                const button = (e.currentTarget as HTMLFormElement).querySelector('button[type="submit"]');
                if (button) {
                    gsap.to(button, {
                        scale: 0.98,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                    });
                }
            }

            try {
                const success = await login(email, password);
                if (success) {
                    // Animazione di uscita prima di navigare
                    gsap.to(cardRef.current, {
                        y: -30,
                        opacity: 0,
                        duration: 0.4,
                        onComplete: () => navigate('/clienti')
                    });
                } else {
                    setError('Credenziali non valide. Riprova.');
                    // Animazione dell'errore più sottile
                    if (cardRef.current) {
                        const shakeTl = gsap.timeline();
                        shakeTl.to(cardRef.current, {x: -5, duration: 0.05})
                            .to(cardRef.current, {x: 5, duration: 0.05})
                            .to(cardRef.current, {x: -5, duration: 0.05})
                            .to(cardRef.current, {x: 0, duration: 0.05});
                    }
                }
            } catch (err) {
                setError('Errore durante il login. Riprova più tardi.');
            } finally {
                setIsLoading(false);
            }
        };

        const togglePasswordVisibility = () => {
            setShowPassword(!showPassword);
        };

        return (
            <div
                ref={containerRef}
                className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 font-lexend"
            >
                {/* Font Lexend */}
                <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
                      rel="stylesheet"/>

                {/* Mesh Gradient Colorato ma Elegante */}
                <div className="fixed inset-0 w-full h-full -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/40 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[20%] left-[-15%] w-[60%] h-[60%] bg-purple-500/30 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[25%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-sky-400/30 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[10%] right-[-20%] w-[60%] h-[60%] bg-teal-500/20 rounded-full blur-[100px]"></div>
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
                </div>

                {/* Card principale */}
                <div
                    ref={cardRef}
                    className="relative z-10 w-full max-w-md mx-auto"
                >
                    <Card
                        className="bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl relative">
                        {/* Effetto acrilico con riflesso */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/10 to-purple-200/10 mix-blend-overlay pointer-events-none"></div>

                        {/* Glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition duration-300"></div>

                        {/* Bordo superiore colorato */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 z-10"></div>

                        <CardHeader className="pb-4 pt-8 relative">
                            <div className="absolute right-6 top-6">
                                <Lock className="text-slate-600 h-5 w-5 opacity-70"/>
                            </div>

                            <div className="flex flex-col items-center space-y-6">
                                <div className="relative">
                                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-16 h-16 rounded-lg flex items-center justify-center shadow-xl">
                                        <Building2 className="h-8 w-8 text-white"/>
                                    </div>
                                    {/* Riflesso sotto l'icona */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-blue-600/20 blur-sm rounded-full"></div>
                                </div>

                                <div className="text-center space-y-2">
                                    <CardTitle
                                        ref={titleRef}
                                        className="text-3xl font-bold text-slate-800"
                                    >
                                        Gestione Lavori
                                    </CardTitle>
                                    <CardDescription className="text-slate-600 text-base max-w-xs mx-auto">
                                        Gestisci i tuoi progetti con efficienza
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-6 relative z-10">
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert variant="destructive"
                                           className="border-red-300 bg-red-100 text-red-800">
                                        <AlertCircle className="h-4 w-4"/>
                                        <AlertDescription className="font-medium">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2 group">
                                    <Label htmlFor="email"
                                           className="text-slate-700 font-medium">Email</Label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-3 h-5 w-5 text-slate-500"/>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@azienda.it"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 py-5 bg-white/90 border-slate-200/70 text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="password"
                                           className="text-slate-700 font-medium">Password</Label>
                                    <div className="relative">
                                        <KeyRound
                                            className="absolute left-3 top-3 h-5 w-5 text-slate-500"/>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10 pr-10 py-5 bg-white/90 border-slate-200/70 text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute right-3 top-3 text-slate-500 hover:text-slate-700 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full py-5 mt-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white rounded-lg font-medium text-base shadow-md transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                        strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor"
                                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Accesso in corso...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center">
                                            <span className="mr-2">Accedi</span>
                                            <ArrowRight className="h-5 w-5"/>
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="px-6 py-4 border-t border-slate-200/30 flex justify-center bg-white/10 backdrop-blur-sm">
                            <p className="text-sm text-slate-600">
                                © 2025 Gestione Lavori • Tutti i diritti riservati
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    };

    export default Login;