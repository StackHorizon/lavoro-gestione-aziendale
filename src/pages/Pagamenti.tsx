// Pagamenti.tsx
import React, {useState, useEffect, useRef} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit,
    CreditCard,
    Calendar,
    Wallet,
    DollarSign,
    Info,
    CheckCircle2,
    ClipboardList,
    AlertCircle,
    BarChart3,
    LogOut
} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import gsap from 'gsap';

interface Pagamento {
    id: string;
    lavoroId: string;
    dataModifica: string;
    importoDovuto: number;
    importoPagato: number;
    causale: string;
}

const Pagamenti = () => {
    const {isAuthenticated, logout} = useAuth();
    const navigate = useNavigate();
    const [pagamenti, setPagamenti] = useState<Pagamento[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pagamentoToDelete, setPagamentoToDelete] = useState<string | null>(null);
    const [editingPagamento, setEditingPagamento] = useState<Pagamento | null>(null);
    const [formData, setFormData] = useState({
        dataModifica: '',
        importoDovuto: '',
        importoPagato: '',
        causale: ''
    });
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Refs per animazioni
    const containerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const deleteDialogRef = useRef<HTMLDivElement>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        fetchPagamenti(parseInt(sessionStorage.getItem("lavoroId") || '0'));
    }, [isAuthenticated, navigate]);

    // Aggiunta stili CSS per il modal su mobile
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media (max-width: 640px) {
              .modal-mobile-fix {
                position: fixed !important;
                inset: auto !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                padding: 0 !important;
                max-width: calc(100% - 2rem) !important;
                width: calc(100% - 2rem) !important;
                max-height: 80vh !important;
                border-radius: 1.2rem !important;
                margin: 0 !important;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
              }

              .modal-mobile-content {
                padding: 1.25rem !important;
              }

              .modal-mobile-buttons {
                padding-top: 1rem !important;
                margin-top: 0.5rem !important;
              }
            }

            @supports (padding: max(0px)) {
              .modal-mobile-fix {
                padding-bottom: max(1.5rem, env(safe-area-inset-bottom)) !important;
              }
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Animazioni all'avvio, ottimizzate
    useEffect(() => {
        if (!hasAnimated && headerRef.current && tableRef.current) {
            // Impostazione per accelerazione hardware
            gsap.config({force3D: true});

            // Inizializza gli elementi con opacità 0
            gsap.set(headerRef.current, {y: -20, opacity: 0, willChange: "transform, opacity"});
            gsap.set(tableRef.current, {y: 30, opacity: 0, scale: 0.98, willChange: "transform, opacity"});

            // Timeline per animazioni sequenziali
            const tl = gsap.timeline({
                onComplete: () => {
                    setHasAnimated(true);
                    // Rimuovi willChange dopo le animazioni per migliorare le prestazioni
                    gsap.set([headerRef.current, tableRef.current], {willChange: "auto"});
                }
            });

            // Anima l'header con durata ridotta
            tl.to(headerRef.current, {
                y: 0,
                opacity: 1,
                duration: 0.3, // Ridotta da 0.5
                ease: "power2.out",
                force3D: true
            });

            // Anima la tabella con durata ridotta
            tl.to(tableRef.current, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.3, // Ridotta da 0.5
                ease: "back.out(1.2)",
                force3D: true
            }, "-=0.2");
        }

        return () => {
            gsap.killTweensOf("*");
        };
    }, [hasAnimated, pagamenti]);

    // Animazione per il modal quando viene aperto (ottimizzata)
    useEffect(() => {
        if (isDialogOpen && modalContentRef.current) {
            gsap.fromTo(
                modalContentRef.current,
                {y: 15, opacity: 0, scale: 0.98},
                {y: 0, opacity: 1, scale: 1, duration: 0.25, ease: "power2.out", force3D: true}
            );
        }
    }, [isDialogOpen]);

    // Animazione per il modal di conferma eliminazione (ottimizzata)
    useEffect(() => {
        if (isDeleteDialogOpen && deleteDialogRef.current) {
            gsap.fromTo(
                deleteDialogRef.current,
                {scale: 0.95, opacity: 0},
                {scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.5)", force3D: true}
            );
        }
    }, [isDeleteDialogOpen]);

    const fetchPagamenti = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`https://api.zimaserver.it/sh/getPagamenti/${id}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });
            if (!res.ok) throw new Error("Errore nella fetch GET");
            const data = await res.json();
            setPagamenti(data.data);
        } catch (error) {
            toast({title: "Errore durante il caricamento dei pagamenti", variant: "destructive"});
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        // Animazione di uscita ottimizzata
        if (headerRef.current && tableRef.current) {
            const tl = gsap.timeline({
                onComplete: () => {
                    navigate(-1);
                }
            });

            tl.to(tableRef.current, {
                y: 30,
                opacity: 0,
                scale: 0.95,
                duration: 0.25, // Ridotta da 0.3
                ease: "power2.in",
                force3D: true
            });

            tl.to(headerRef.current, {
                y: -20,
                opacity: 0,
                duration: 0.25, // Ridotta da 0.3
                ease: "power2.in",
                force3D: true
            }, "-=0.2");
        } else {
            navigate(-1);
        }
    };

    // Funzione per navigare alla dashboard
    const handleNavigateToDashboard = () => {
        // Animazione di uscita ottimizzata
        if (headerRef.current && tableRef.current) {
            const tl = gsap.timeline({
                onComplete: () => {
                    navigate("/dashboard");
                }
            });

            tl.to(tableRef.current, {
                y: 30,
                opacity: 0,
                scale: 0.95,
                duration: 0.25,
                ease: "power2.in",
                force3D: true
            });

            tl.to(headerRef.current, {
                y: -20,
                opacity: 0,
                duration: 0.25,
                ease: "power2.in",
                force3D: true
            }, "-=0.2");
        } else {
            navigate("/dashboard");
        }
    };

    // Funzione per il logout
    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleAddPagamento = () => {
        setEditingPagamento(null);
        setFormData({
            dataModifica: new Date().toISOString().split('T')[0],
            importoDovuto: '',
            importoPagato: '',
            causale: ''
        });
        setIsDialogOpen(true);

        // Animazione pulsante ottimizzata
        const button = document.querySelector('button[aria-haspopup="dialog"]');
        if (button) {
            gsap.fromTo(
                button,
                {scale: 1},
                {
                    scale: 0.95,
                    duration: 0.08, // Ridotta da 0.1
                    yoyo: true,
                    repeat: 1,
                    ease: "power1.out",
                    force3D: true
                }
            );
        }
    };

    const handleEditPagamento = (pagamento: Pagamento) => {
        setEditingPagamento(pagamento);
        setFormData({
            dataModifica: pagamento.dataModifica,
            importoDovuto: pagamento.importoDovuto.toString(),
            importoPagato: pagamento.importoPagato.toString(),
            causale: pagamento.causale
        });
        setIsDialogOpen(true);
    };

    const confirmDeletePagamento = (id: string) => {
        setPagamentoToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeletePagamento = async () => {
        if (!pagamentoToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`https://api.zimaserver.it/sh/deletePagamento/${pagamentoToDelete}`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });
            if (!res.ok) throw new Error("Errore nella fetch DELETE");
            const data = await res.json();

            // Animazione per la riga da eliminare (ottimizzata)
            const rowToRemove = document.querySelector(`tr[data-id="${pagamentoToDelete}"]`);
            if (rowToRemove) {
                gsap.to(rowToRemove, {
                    opacity: 0,
                    height: 0,
                    duration: 0.25, // Ridotta da 0.3
                    force3D: true,
                    onComplete: () => {
                        const lavoroIdStored = sessionStorage.getItem("lavoroId") || '0';
                        fetchPagamenti(parseInt(lavoroIdStored));
                        setIsDeleteDialogOpen(false);
                        setPagamentoToDelete(null);
                    }
                });
            } else {
                const lavoroIdStored = sessionStorage.getItem("lavoroId") || '0';
                await fetchPagamenti(parseInt(lavoroIdStored));
                setIsDeleteDialogOpen(false);
                setPagamentoToDelete(null);
            }

            toast({title: data.message, variant: "default"});
        } catch (error) {
            toast({title: "Errore durante la richiesta", variant: "destructive"});
            setIsDeleteDialogOpen(false);
            setPagamentoToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Animazione del pulsante al click (ottimizzata)
        if (formRef.current) {
            const button = formRef.current.querySelector('button[type="submit"]');
            if (button) {
                gsap.to(button, {
                    scale: 0.95,
                    duration: 0.08, // Ridotta da 0.1
                    yoyo: true,
                    repeat: 1,
                    force3D: true
                });
            }
        }

        // Usa il lavoroId sempre da sessionStorage per coerenza
        const lavoroIdStored = sessionStorage.getItem("lavoroId") || '';
        if (!lavoroIdStored) {
            toast({title: "ID lavoro mancante", variant: "destructive"});
            return;
        }

        const pagamentoData = {
            lavoroId: lavoroIdStored,
            dataModifica: formData.dataModifica,
            importoDovuto: parseFloat(formData.importoDovuto),
            importoPagato: parseFloat(formData.importoPagato),
            causale: formData.causale
        };

        setLoading(true);
        try {
            if (editingPagamento) {
                const response = await fetch(`https://api.zimaserver.it/sh/updatePagamento/${editingPagamento.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(pagamentoData),
                });

                const data = await response.json();
                if (response.ok) {
                    await fetchPagamenti(parseInt(lavoroIdStored));
                }
                toast({title: data.message, variant: response.ok ? "default" : "destructive"});
            } else {
                const res = await fetch("https://api.zimaserver.it/sh/addPagamento", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(pagamentoData),
                });

                if (!res.ok) throw new Error("Errore nella fetch POST");
                const data = await res.json();
                await fetchPagamenti(parseInt(lavoroIdStored));
                toast({title: data.message, variant: "default"});
            }
        } catch (error) {
            toast({title: "Errore durante la richiesta", variant: "destructive"});
        } finally {
            setLoading(false);
        }

        setIsDialogOpen(false);
        setFormData({dataModifica: '', importoDovuto: '', importoPagato: '', causale: ''});
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT');
    };

    const getTotalImportoDovuto = () => {
        return pagamenti.reduce((sum, pagamento) => sum + pagamento.importoDovuto, 0);
    };

    const getTotalImportoPagato = () => {
        return pagamenti.reduce((sum, pagamento) => sum + pagamento.importoPagato, 0);
    };

    const getTotalImportoMancante = () => {
        return getTotalImportoDovuto() - getTotalImportoPagato();
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen relative overflow-hidden font-lexend"
        >
            {/* Font Lexend */}
            <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
                  rel="stylesheet"/>

            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 w-full h-full -z-10">
                <div
                    className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/30 rounded-full blur-[100px]"></div>
                <div
                    className="absolute top-[20%] left-[-15%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[100px]"></div>
                <div
                    className="absolute bottom-[-10%] left-[25%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div
                    className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-sky-400/20 rounded-full blur-[100px]"></div>
                <div
                    className="absolute bottom-[10%] right-[-20%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
            </div>

            {/* Header with Glassmorphism */}
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
                                <span>Torna ai Lavori</span>
                            </Button>
                            <div
                                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                <CreditCard className="h-5 w-5 text-white"/>
                            </div>
                            <h1 className="text-xl font-semibold text-slate-800">Gestione Pagamenti</h1>
                        </div>

                        {/* Pulsanti Dashboard e Logout */}
                        <div className="flex items-center gap-4">
                            {/* Pulsante Dashboard */}
                            <Button
                                variant="outline"
                                onClick={handleNavigateToDashboard}
                                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                disabled={loading}
                            >
                                <BarChart3 className="h-4 w-4"/>
                                <span>Dashboard</span>
                            </Button>

                            {/* Pulsante Logout */}
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                disabled={loading}
                            >
                                <LogOut className="h-4 w-4"/>
                                <span>Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Titolo e pulsante di aggiunta */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Wallet className="h-6 w-6 text-indigo-600"/>
                            Pagamenti
                        </h2>
                        <p className="text-slate-500 mt-1">
                            {pagamenti.length} {pagamenti.length !== 1 ? 'pagamenti' : 'pagamento'} registrati
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={handleAddPagamento}
                                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md transition-all duration-200 flex items-center gap-2"
                                disabled={loading}
                            >
                                <Plus className="h-4 w-4"/>
                                Nuovo Pagamento
                            </Button>
                        </DialogTrigger>

                        <DialogContent
                            className="p-0 overflow-hidden border-0 shadow-2xl sm:max-w-md modal-mobile-fix"
                        >
                            <div
                                ref={modalContentRef}
                                className="bg-white/90 backdrop-blur-xl relative"
                            >
                                {/* Effetto acrilico con riflesso */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                                {/* Bordo superiore colorato */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 z-10"></div>

                                {/* Glow effect */}
                                <div
                                    className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-xl blur-md opacity-70"></div>

                                <div className="relative z-10 p-6 modal-mobile-content">
                                    <DialogHeader className="pb-2">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div
                                                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                                <CreditCard className="h-5 w-5 text-white"/>
                                            </div>
                                            <DialogTitle
                                                className="text-xl font-semibold text-slate-800">
                                                {editingPagamento ? 'Modifica Pagamento' : 'Nuovo Pagamento'}
                                            </DialogTitle>
                                        </div>
                                        <DialogDescription className="text-slate-500">
                                            {editingPagamento
                                                ? 'Aggiorna i dettagli del pagamento compilando il modulo sottostante.'
                                                : 'Aggiungi un nuovo pagamento compilando il modulo sottostante.'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 mt-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="dataModifica"
                                                   className="text-slate-700 font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-indigo-500"/>
                                                Data Modifica
                                            </Label>
                                            <Input
                                                id="dataModifica"
                                                type="date"
                                                value={formData.dataModifica}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    dataModifica: e.target.value
                                                })}
                                                required
                                                className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="importoDovuto"
                                                       className="text-slate-700 font-medium flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-indigo-500"/>
                                                    Importo Dovuto (€)
                                                </Label>
                                                <Input
                                                    id="importoDovuto"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.importoDovuto}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        importoDovuto: e.target.value
                                                    })}
                                                    required
                                                    className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="importoPagato"
                                                       className="text-slate-700 font-medium flex items-center gap-2">
                                                    <Wallet className="h-4 w-4 text-indigo-500"/>
                                                    Importo Pagato (€)
                                                </Label>
                                                <Input
                                                    id="importoPagato"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.importoPagato}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        importoPagato: e.target.value
                                                    })}
                                                    required
                                                    className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                    disabled={loading}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="causale"
                                                   className="text-slate-700 font-medium flex items-center gap-2">
                                                <Info className="h-4 w-4 text-indigo-500"/>
                                                Causale
                                            </Label>
                                            <Textarea
                                                id="causale"
                                                value={formData.causale}
                                                onChange={(e) => setFormData({...formData, causale: e.target.value})}
                                                required
                                                rows={3}
                                                placeholder="Descrivi la causale del pagamento"
                                                className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2 modal-mobile-buttons">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsDialogOpen(false)}
                                                className="border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                                                disabled={loading}
                                            >
                                                Annulla
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center gap-2">
                                                        <svg className="animate-spin h-4 w-4 text-white"
                                                             xmlns="http://www.w3.org/2000/svg" fill="none"
                                                             viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                                                    stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor"
                                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Elaborazione...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {editingPagamento ? 'Aggiorna' : 'Aggiungi'}
                                                        <CheckCircle2 className="h-4 w-4"/>
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Dialog di conferma eliminazione */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="p-0 overflow-hidden border-0 shadow-xl sm:max-w-sm modal-mobile-fix">
                        <div
                            ref={deleteDialogRef}
                            className="bg-white/90 backdrop-blur-xl relative"
                        >
                            {/* Effetto acrilico con riflesso */}
                            <div
                                className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                            <div
                                className="absolute inset-0 bg-gradient-to-tr from-red-100/10 to-orange-100/10 mix-blend-overlay pointer-events-none"></div>

                            {/* Bordo superiore colorato */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-400 z-10"></div>

                            {/* Glow effect */}
                            <div
                                className="absolute -inset-0.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl blur-md opacity-70"></div>

                            <div className="relative z-10 p-6 modal-mobile-content">
                                <DialogHeader className="pb-2">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div
                                            className="bg-gradient-to-br from-red-500 to-orange-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                            <Trash2 className="h-5 w-5 text-white"/>
                                        </div>
                                        <DialogTitle className="text-xl font-semibold text-slate-800">
                                            Conferma eliminazione
                                        </DialogTitle>
                                    </div>
                                    <DialogDescription className="text-slate-500 pt-2">
                                        Sei sicuro di voler eliminare questo pagamento?
                                        Questa azione non può essere annullata.
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogFooter className="flex justify-end gap-3 pt-6 modal-mobile-buttons">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        className="border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                                        disabled={isDeleting}
                                    >
                                        Annulla
                                    </Button>
                                    <Button
                                        onClick={handleDeletePagamento}
                                        className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-md"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <div className="flex items-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white"
                                                     xmlns="http://www.w3.org/2000/svg" fill="none"
                                                     viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10"
                                                            stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor"
                                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Eliminazione...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Trash2 className="h-4 w-4"/>
                                                Elimina pagamento
                                            </div>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {loading && pagamenti.length === 0 ? (
                    <div className="flex justify-center py-32">
                        <div className="flex flex-col items-center">
                            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-3"
                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-slate-500 text-lg">Caricamento pagamenti...</p>
                        </div>
                    </div>
                ) : pagamenti.length === 0 ? (
                    <div
                        className="bg-white/30 backdrop-blur-md border border-slate-200/50 rounded-xl p-12 text-center">
                        <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4"/>
                        <h3 className="text-xl font-medium text-slate-700 mb-2">Nessun pagamento trovato</h3>
                        <p className="text-slate-500 mb-6">
                            Non ci sono ancora pagamenti registrati per questo lavoro. Aggiungine uno nuovo!
                        </p>
                        <Button
                            onClick={handleAddPagamento}
                            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2"/>
                            Nuovo Pagamento
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Card con i totali */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card
                                className="bg-white/30 backdrop-blur-md border border-white/40 overflow-hidden relative">
                                {/* Effetto acrilico con riflesso */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                                {/* Bordo superiore colorato */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 z-10"></div>

                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                            <DollarSign className="h-5 w-5 text-white"/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Importo Dovuto</p>
                                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(getTotalImportoDovuto())}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="bg-white/30 backdrop-blur-md border border-white/40 overflow-hidden relative">
                                {/* Effetto acrilico con riflesso */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                                {/* Bordo superiore colorato */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600 z-10"></div>

                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="bg-gradient-to-br from-green-500 to-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                            <Wallet className="h-5 w-5 text-white"/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Importo Pagato</p>
                                            <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalImportoPagato())}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className="bg-white/30 backdrop-blur-md border border-white/40 overflow-hidden relative">
                                {/* Effetto acrilico con riflesso */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                                {/* Bordo superiore colorato - rosso se c'è un importo mancante, verde altrimenti */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                                    getTotalImportoMancante() > 0
                                        ? 'from-red-500 to-orange-500'
                                        : 'from-green-500 to-emerald-600'
                                } z-10`}></div>

                                <CardContent className="pt-6 relative">
                                    <div className="flex items-center gap-3">
                                        <div className={`bg-gradient-to-br ${
                                            getTotalImportoMancante() > 0
                                                ? 'from-red-500 to-orange-500'
                                                : 'from-green-500 to-emerald-600'
                                        } w-10 h-10 rounded-lg flex items-center justify-center shadow-md`}>
                                            {getTotalImportoMancante() > 0
                                                ? <AlertCircle className="h-5 w-5 text-white"/>
                                                : <CheckCircle2 className="h-5 w-5 text-white"/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">Importo Mancante</p>
                                            <p className={`text-2xl font-bold ${
                                                getTotalImportoMancante() > 0
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                            }`}>
                                                {formatCurrency(getTotalImportoMancante())}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabella dei pagamenti */}
                        <Card className="bg-white/30 backdrop-blur-md border border-white/40 overflow-hidden relative">
                            {/* Effetto acrilico con riflesso */}
                            <div
                                className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                            <div
                                className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                            {/* Bordo superiore colorato */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 z-10"></div>

                            <CardHeader className="relative">
                                <CardTitle className="text-slate-800">Storico Pagamenti</CardTitle>
                            </CardHeader>

                            <CardContent className="relative">
                                <div className="rounded-md overflow-hidden">
                                    <Table ref={tableRef}>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="text-slate-700">Data</TableHead>
                                                <TableHead className="text-slate-700">Importo Dovuto</TableHead>
                                                <TableHead className="text-slate-700">Importo Pagato</TableHead>
                                                <TableHead className="text-slate-700">Importo Mancante</TableHead>
                                                <TableHead className="text-slate-700">Causale</TableHead>
                                                <TableHead className="text-right text-slate-700">Azioni</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pagamenti.map((pagamento) => {
                                                const importoMancante = pagamento.importoDovuto - pagamento.importoPagato;
                                                return (
                                                    <TableRow
                                                        key={pagamento.id}
                                                        data-id={pagamento.id}
                                                        className="hover:bg-slate-50/70 transition-colors"
                                                    >
                                                        <TableCell className="font-medium text-slate-700">
                                                            {formatDate(pagamento.dataModifica)}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-slate-800">
                                                            {formatCurrency(pagamento.importoDovuto)}
                                                        </TableCell>
                                                        <TableCell className="text-green-600 font-medium">
                                                            {formatCurrency(pagamento.importoPagato)}
                                                        </TableCell>
                                                        <TableCell
                                                            className={`font-medium ${importoMancante > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {formatCurrency(importoMancante)}
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate text-slate-700"
                                                                   title={pagamento.causale}>
                                                            {pagamento.causale.length > 25 ? pagamento.causale.substring(0, 22) + "..." : pagamento.causale}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleEditPagamento(pagamento)}
                                                                    className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                                                                    aria-label="Modifica pagamento"
                                                                    disabled={loading}
                                                                >
                                                                    <Edit className="h-4 w-4"/>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => confirmDeletePagamento(pagamento.id)}
                                                                    className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50/50"
                                                                    aria-label="Elimina pagamento"
                                                                    disabled={loading}
                                                                >
                                                                    <Trash2 className="h-4 w-4"/>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Pagamenti;