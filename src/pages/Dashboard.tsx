import React, {useState, useEffect, useRef} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {toast} from '@/components/ui/use-toast';
import {Progress} from '@/components/ui/progress';
import {Skeleton} from '@/components/ui/skeleton';
import {
    BarChart3, PieChart, ArrowLeft, DollarSign, Activity,
    CheckCircle2, Users, CreditCard, ArrowUpRight
} from 'lucide-react';
import gsap from 'gsap';
import {
    Chart as ChartJS,
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale,
    BarElement, Title,
    PointElement, LineElement,
    RadialLinearScale, ChartTypeRegistry,
    TooltipItem as ChartJsTooltipItem
} from 'chart.js';
import {Doughnut, Bar} from 'react-chartjs-2';
import CountUp from 'react-countup';

// Registra i componenti ChartJS necessari
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    RadialLinearScale
);

// Interfacce per i dati
interface DashboardStats {
    totaleDaRicevere: number;
    totaleRicevuti: number;
    progettiAnnullati: number;
    progettiSospesi: number;
    progettiInCorso: number;
    progettiCompletati: number;
    totaleProgetti: number;
}

// Definizione dell'interfaccia per il contesto del tooltip
interface TooltipItem<TType extends keyof ChartTypeRegistry = keyof ChartTypeRegistry> {
    chart: ChartJS<TType>;
    dataIndex: number;
    dataset: {
        data: number[];
        label?: string;
    };
    datasetIndex: number;
    parsed: {
        x?: number;
        y?: number;
        _custom?: unknown;
    };
    raw: unknown;
    formattedValue: string;
    label: string;
}

const Dashboard = () => {
    const {isAuthenticated} = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totaleDaRicevere: 0,
        totaleRicevuti: 0,
        progettiAnnullati: 0,
        progettiSospesi: 0,
        progettiInCorso: 0,
        progettiCompletati: 0,
        totaleProgetti: 0
    });
    const [loading, setLoading] = useState(true);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Refs per animazioni
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const statsCardsRef = useRef<HTMLDivElement>(null);
    const chartsSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        fetchDashboardData();
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!hasAnimated && !loading && headerRef.current && statsCardsRef.current && chartsSectionRef.current) {
            const tl = gsap.timeline({
                onComplete: () => {
                    setHasAnimated(true);
                    gsap.set([headerRef.current, statsCardsRef.current.children, chartsSectionRef.current.children],
                        {willChange: "auto"});
                }
            });

            gsap.set(headerRef.current, {y: -20, opacity: 0});
            gsap.set(statsCardsRef.current.children, {y: 20, opacity: 0, scale: 0.98});
            gsap.set(chartsSectionRef.current.children, {y: 30, opacity: 0, scale: 0.98});

            tl.to(headerRef.current, {
                y: 0,
                opacity: 1,
                duration: 0.4,
                ease: "power2.out"
            });

            tl.to(statsCardsRef.current.children, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.4,
                stagger: 0.07,
                ease: "back.out(1.4)"
            }, "-=0.2");

            tl.to(chartsSectionRef.current.children, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.4,
                stagger: 0.1,
                ease: "back.out(1.4)"
            }, "-=0.3");
        }

        return () => {
            gsap.killTweensOf("*");
        };
    }, [hasAnimated, loading]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const endpoints = [
                "recuperaTotaleSoldiDaRicevere",
                "recuperaTotaleSoldiRicevuti",
                "recuperaNumeroProgettiAnnullati",
                "recuperaNumeroProgettiSospesi",
                "recuperaNumeroProgettiInCorso",
                "recuperaNumeroProgettiCompletati",
                "recuperaNumeroProgetti"
            ];

            console.log("Richiamo degli endpoint:", endpoints);

            const results = await Promise.all(
                endpoints.map(endpoint =>
                    fetch(`https://api.zimaserver.it/sh/${endpoint}`, {
                        method: "GET",
                        headers: {"Content-Type": "application/json"},
                        credentials: "include",
                    })
                        .then(res => res.json())
                        .then(data => {
                            console.log(`Dati da endpoint ${endpoint}:`, data);
                            return data;
                        })
                        .catch(err => {
                            console.error(`Errore nell'endpoint ${endpoint}:`, err);
                            return {};
                        })
                )
            );

            console.log("Tutti i risultati degli endpoint:", results);

            // Aggiornato per adattarsi alla struttura reale dei dati
            const newStats = {
                totaleDaRicevere: results[0]?.totaleSoldiDaRicevere || 0,
                totaleRicevuti: results[1]?.totaleSoldiRicevuti || 0,
                progettiAnnullati: results[2]?.numeroProgettiAnnullati || 0,
                progettiSospesi: results[3]?.numeroProgettiSospesi || 0,
                progettiInCorso: results[4]?.numeroProgettiInCorso || 0,
                progettiCompletati: results[5]?.numeroProgettiCompletati || 0,
                totaleProgetti: results[6]?.numeroProgetti || 0
            };

            console.log("Statistiche aggiornate:", newStats);
            setStats(newStats);
        } catch (error) {
            console.error("Errore generale durante il recupero dei dati:", error);
            toast({
                title: "Errore durante il caricamento dei dati",
                description: "Impossibile recuperare i dati della dashboard",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (headerRef.current && statsCardsRef.current && chartsSectionRef.current) {
            const tl = gsap.timeline({
                onComplete: () => navigate(-1)
            });

            tl.to(chartsSectionRef.current.children, {
                y: 30,
                opacity: 0,
                scale: 0.95,
                stagger: 0.05,
                duration: 0.3,
                ease: "power2.in"
            });

            tl.to(statsCardsRef.current.children, {
                y: 20,
                opacity: 0,
                scale: 0.95,
                stagger: 0.04,
                duration: 0.3,
                ease: "power2.in"
            }, "-=0.2");

            tl.to(headerRef.current, {
                y: -20,
                opacity: 0,
                duration: 0.25,
                ease: "power2.in"
            }, "-=0.2");
        } else {
            navigate(-1);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatPercentage = (value: number, total: number) => {
        if (total === 0) return '0%';
        return `${Math.round((value / total) * 100)}%`;
    };

    // Dati per il grafico a ciambella degli stati dei progetti
    const doughnutChartData = {
        labels: ['Completati', 'In Corso', 'Sospesi', 'Annullati'],
        datasets: [
            {
                data: [
                    stats.progettiCompletati,
                    stats.progettiInCorso,
                    stats.progettiSospesi,
                    stats.progettiAnnullati
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',  // Verde per completati
                    'rgba(59, 130, 246, 0.8)',  // Blu per in corso
                    'rgba(250, 204, 21, 0.8)',  // Giallo per sospesi
                    'rgba(239, 68, 68, 0.8)',   // Rosso per annullati
                ],
                borderColor: [
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(250, 204, 21)',
                    'rgb(239, 68, 68)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Dati per il grafico a barre dei pagamenti
    const barChartData = {
        labels: ['Stato Finanziario'],
        datasets: [
            {
                label: 'Importo Ricevuto',
                data: [stats.totaleRicevuti],
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
            },
            {
                label: 'Importo da Ricevere',
                data: [stats.totaleDaRicevere],
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1,
            },
        ],
    };

    // Opzioni per il grafico a ciambella
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: ChartJsTooltipItem<"doughnut">) {
                        const label = context.label || '';
                        const value = context.raw as number;
                        const dataset = context.dataset as { data: number[] };
                        const total = dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        cutout: '65%',
        animation: {
            animateRotate: true,
            animateScale: true
        }
    };

// Opzioni per il grafico a barre
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    callback: function (value: number) {
                        return formatCurrency(value);
                    }
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: ChartJsTooltipItem<"bar">) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        }
    };


    // Calcolo dell'efficienza del budget (quanto è stato pagato rispetto al totale)
    const calcBudgetEfficiency = () => {
        const total = stats.totaleDaRicevere + stats.totaleRicevuti;
        if (total === 0) return 0;
        return (stats.totaleRicevuti / total) * 100;
    };

    // Calcolo del tasso di completamento dei progetti
    const calcCompletionRate = () => {
        if (stats.totaleProgetti === 0) return 0;
        return (stats.progettiCompletati / stats.totaleProgetti) * 100;
    };

    if (!isAuthenticated) {
        return null;
    }

    const SkeletonLoader = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-white/60 backdrop-blur-md border border-white/50">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-5 w-1/3"/>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-3/4 mb-2"/>
                            <Skeleton className="h-4 w-1/2"/>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="bg-white/60 backdrop-blur-md border border-white/50">
                        <CardHeader>
                            <Skeleton className="h-6 w-1/3"/>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[240px] w-full"/>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className="min-h-screen font-lexend relative overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-50"
        >
            {/* Font Lexend */}
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
                  rel="stylesheet"/>

            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 w-full h-full -z-10">
                <div
                    className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/20 rounded-full blur-[120px]"></div>
                <div
                    className="absolute top-[20%] left-[-15%] w-[60%] h-[60%] bg-purple-500/15 rounded-full blur-[120px]"></div>
                <div
                    className="absolute bottom-[-10%] left-[25%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px]"></div>
                <div
                    className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-sky-400/15 rounded-full blur-[120px]"></div>
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Header con Glassmorphism */}
            <header
                ref={headerRef}
                className="sticky top-0 z-30 backdrop-blur-md bg-white/50 border-b border-slate-200/50 shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={handleBack}
                                variant="outline"
                                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                disabled={loading}
                            >
                                <ArrowLeft className="h-4 w-4"/>
                                <span>Indietro</span>
                            </Button>
                            <div
                                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                <BarChart3 className="h-5 w-5 text-white"/>
                            </div>
                            <h1 className="text-xl font-semibold text-slate-800">Dashboard Analisi</h1>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => fetchDashboardData()}
                            className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            disabled={loading}
                        >
                            {loading ? (
                                <svg className="animate-spin h-4 w-4 text-slate-700"
                                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <Activity className="h-4 w-4"/>
                            )}
                            <span>{loading ? "Aggiornamento..." : "Aggiorna dati"}</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {loading && Object.values(stats).every(value => value === 0) ? (
                    <SkeletonLoader/>
                ) : (
                    <div className="space-y-8">
                        <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                            Panoramica Aziendale
                        </h2>

                        {/* Statistiche Principali */}
                        <div ref={statsCardsRef}
                             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden group rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Progetti
                                        Totali</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CountUp
                                                start={0}
                                                end={stats.totaleProgetti}
                                                duration={2}
                                                separator="."
                                                className="text-2xl font-bold text-slate-800"
                                            />
                                            <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                                                                    <span
                                                                                                        className="flex items-center text-emerald-600 mr-1">
                                                                                                        <ArrowUpRight
                                                                                                            className="h-3 w-3 mr-0.5"/>
                                                                                                        {stats.progettiInCorso}
                                                                                                    </span> in corso
                                            </p>
                                        </div>
                                        <div
                                            className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 transition-transform group-hover:scale-110 group-hover:bg-violet-200">
                                            <Users className="h-6 w-6"/>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden group rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Progetti
                                        Completati</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CountUp
                                                start={0}
                                                end={stats.progettiCompletati}
                                                duration={2}
                                                separator="."
                                                className="text-2xl font-bold text-slate-800"
                                            />
                                            <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                                                                    <span
                                                                                                        className="flex items-center text-emerald-600 mr-1">
                                                                                                        <ArrowUpRight
                                                                                                            className="h-3 w-3 mr-0.5"/>
                                                                                                        {formatPercentage(stats.progettiCompletati, stats.totaleProgetti)}
                                                                                                    </span> completati
                                            </p>
                                        </div>
                                        <div
                                            className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110 group-hover:bg-emerald-200">
                                            <CheckCircle2 className="h-6 w-6"/>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden group rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Importo
                                        Ricevuto</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CountUp
                                                start={0}
                                                end={stats.totaleRicevuti}
                                                duration={2}
                                                separator="."
                                                decimals={2}
                                                decimal=","
                                                prefix="€ "
                                                className="text-2xl font-bold text-slate-800"
                                            />
                                            <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                                                                    <span
                                                                                                        className="flex items-center text-emerald-600 mr-1">
                                                                                                        <ArrowUpRight
                                                                                                            className="h-3 w-3 mr-0.5"/>
                                                                                                        {formatPercentage(stats.totaleRicevuti, stats.totaleRicevuti + stats.totaleDaRicevere)}
                                                                                                    </span> incassato
                                            </p>
                                        </div>
                                        <div
                                            className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 transition-transform group-hover:scale-110 group-hover:bg-green-200">
                                            <DollarSign className="h-6 w-6"/>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden group rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">Da
                                        Ricevere</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CountUp
                                                start={0}
                                                end={stats.totaleDaRicevere}
                                                duration={2}
                                                separator="."
                                                decimals={2}
                                                decimal=","
                                                prefix="€ "
                                                className="text-2xl font-bold text-slate-800"
                                            />
                                            <p className="text-xs text-slate-500 mt-1 flex items-center">
                                                                                                    <span
                                                                                                        className="flex items-center text-amber-600 mr-1">
                                                                                                        <ArrowUpRight
                                                                                                            className="h-3 w-3 mr-0.5"/>
                                                                                                        {formatPercentage(stats.totaleDaRicevere, stats.totaleRicevuti + stats.totaleDaRicevere)}
                                                                                                    </span> in attesa
                                            </p>
                                        </div>
                                        <div
                                            className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110 group-hover:bg-amber-200">
                                            <CreditCard className="h-6 w-6"/>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Grafici */}
                        <div ref={chartsSectionRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden rounded-xl">
                                <CardHeader className="pb-4">
                                    <CardTitle
                                        className="text-lg font-semibold text-slate-800 flex items-center">
                                        <PieChart className="h-5 w-5 mr-2 text-indigo-600"/>
                                        Stato dei Progetti
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] relative flex">
                                        <div className="flex-1 relative">
                                            <Doughnut data={doughnutChartData} options={{
                                                ...doughnutOptions,
                                                cutout: '70%',
                                                plugins: {
                                                    legend: {
                                                        position: 'right' as const,
                                                        align: 'center' as const,
                                                    },
                                                    tooltip: doughnutOptions.plugins.tooltip
                                                }
                                            }}/>
                                            <div
                                                className="absolute pointer-events-none flex flex-col items-center justify-center"
                                                style={{
                                                    left: '38.5%',  // Ridotto da 40% a 35% per centrare meglio rispetto alla ciambella
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    width: 'auto'
                                                }}>
                                                <div
                                                    className="text-3xl font-bold text-slate-800">{stats.totaleProgetti}</div>
                                                <div className="text-xs text-slate-500">Progetti totali</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter
                                    className="bg-slate-50/70 pt-3 pb-4 px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-b-xl">
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                                            Completati
                                        </div>
                                        <div className="text-sm font-semibold">{stats.progettiCompletati}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                                            In Corso
                                        </div>
                                        <div className="text-sm font-semibold">{stats.progettiInCorso}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></div>
                                            Sospesi
                                        </div>
                                        <div className="text-sm font-semibold">{stats.progettiSospesi}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                                            Annullati
                                        </div>
                                        <div className="text-sm font-semibold">{stats.progettiAnnullati}</div>
                                    </div>
                                </CardFooter>
                            </Card>

                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden rounded-xl">
                                <CardHeader className="pb-4">
                                    <CardTitle
                                        className="text-lg font-semibold text-slate-800 flex items-center">
                                        <BarChart3 className="h-5 w-5 mr-2 text-indigo-600"/>
                                        Bilancio Finanziario
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <Bar data={barChartData} options={barChartOptions}/>
                                    </div>
                                </CardContent>
                                <CardFooter
                                    className="bg-slate-50/70 pt-3 pb-4 px-6 grid grid-cols-2 gap-4 rounded-b-xl">
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                                            Ricevuto
                                        </div>
                                        <div
                                            className="text-sm font-semibold">{formatCurrency(stats.totaleRicevuti)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                                            Da Ricevere
                                        </div>
                                        <div
                                            className="text-sm font-semibold">{formatCurrency(stats.totaleDaRicevere)}</div>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md font-medium text-slate-700 flex items-center">
                                        <Activity className="h-4 w-4 mr-2 text-indigo-600"/>
                                        Efficienza Budget
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                                                                            <span
                                                                                                className="text-3xl font-bold text-slate-800">
                                                                                              {Math.round(calcBudgetEfficiency())}%
                                                                                            </span>
                                        <span className="text-sm text-slate-500">
                                                                                              Pagamenti Ricevuti / Totale
                                                                                            </span>
                                    </div>
                                    <Progress value={calcBudgetEfficiency()} className="h-2.5 bg-slate-200/70"/>
                                    <div className="pt-2 text-sm text-slate-600">
                                        <div className="flex justify-between items-center">
                                            <span>Totale Budget</span>
                                            <span className="font-medium">
                                                                                                    {formatCurrency(stats.totaleRicevuti + stats.totaleDaRicevere)}
                                                                                                </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="bg-white/70 backdrop-blur-md border border-white/60 transition-all duration-300 hover:shadow-lg hover:bg-white/80 overflow-hidden rounded-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-md font-medium text-slate-700 flex items-center">
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-600"/>
                                        Tasso Completamento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                                                                            <span
                                                                                                className="text-3xl font-bold text-slate-800">
                                                                                              {Math.round(calcCompletionRate())}%
                                                                                            </span>
                                        <span className="text-sm text-slate-500">
                                                                                              Progetti Completati / Totale
                                                                                            </span>
                                    </div>
                                    <Progress value={calcCompletionRate()} className="h-2.5 bg-slate-200/70"/>
                                    <div className="pt-2 grid grid-cols-2 gap-4 text-sm text-slate-600">
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                                            <span>In Corso: {stats.progettiInCorso}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                                            <span>Completati: {stats.progettiCompletati}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;