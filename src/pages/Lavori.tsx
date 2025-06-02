import React, {useState, useEffect, useRef} from 'react';
        import {useAuth} from '@/contexts/AuthContext';
        import {useNavigate} from 'react-router-dom';
        import {Button} from '@/components/ui/button';
        import {Input} from '@/components/ui/input';
        import {Label} from '@/components/ui/label';
        import {Textarea} from '@/components/ui/textarea';
        import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
        import {Card, CardContent, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
        import {
            Dialog,
            DialogContent,
            DialogHeader,
            DialogTitle,
            DialogTrigger,
            DialogFooter,
            DialogDescription,
        } from '@/components/ui/dialog';
        import {
            ArrowLeft,
            Plus,
            Trash2,
            Edit,
            Search,
            Building2,
            CheckCircle2,
            AlertCircle,
            ArrowRight,
            ClipboardList
        } from 'lucide-react';
        import {toast} from '@/hooks/use-toast';
        import gsap from 'gsap';
        import {Alert, AlertDescription} from '@/components/ui/alert';

        interface Lavoro {
            id: string;
            clienteId: string;
            titolo: string;
            descrizione: string;
            stato: 'in corso' | 'completato' | 'sospeso' | 'annullato';
        }

        const Lavori = () => {
            const {isAuthenticated} = useAuth();
            const navigate = useNavigate();
            const [lavori, setLavori] = useState<Lavoro[]>([]);
            const [isDialogOpen, setIsDialogOpen] = useState(false);
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [lavoroToDelete, setLavoroToDelete] = useState<string | null>(null);
            const [editingLavoro, setEditingLavoro] = useState<Lavoro | null>(null);
            const [formData, setFormData] = useState({
                titolo: '',
                descrizione: '',
                stato: 'in corso' as Lavoro['stato']
            });
            const [loading, setLoading] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);
            const [searchTerm, setSearchTerm] = useState("");
            const [hasAnimated, setHasAnimated] = useState(false);

            // Refs per animazioni
            const containerRef = useRef<HTMLDivElement>(null);
            const headerRef = useRef<HTMLElement>(null);
            const cardGridRef = useRef<HTMLDivElement>(null);
            const searchBarRef = useRef<HTMLDivElement>(null);
            const formRef = useRef<HTMLFormElement>(null);
            const deleteDialogRef = useRef<HTMLDivElement>(null);
            const modalContentRef = useRef<HTMLDivElement>(null);

            // Filtra i lavori in base al termine di ricerca
            const filteredLavori = lavori.filter(
                lavoro =>
                    lavoro.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lavoro.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    lavoro.stato.toLowerCase().includes(searchTerm.toLowerCase())
            );

            useEffect(() => {
                if (!isAuthenticated) {
                    navigate('/');
                    return;
                }
                fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
            }, [isAuthenticated, navigate]);

            // Animazioni all'avvio, solo la prima volta
            useEffect(() => {
                if (!hasAnimated && headerRef.current && cardGridRef.current && searchBarRef.current) {
                    // Inizializza gli elementi con opacità 0
                    gsap.set(headerRef.current, {y: -20, opacity: 0});
                    gsap.set(searchBarRef.current, {y: 20, opacity: 0});
                    gsap.set(cardGridRef.current.children, {y: 30, opacity: 0, scale: 0.95});

                    // Timeline per animazioni sequenziali
                    const tl = gsap.timeline({
                        onComplete: () => {
                            setHasAnimated(true);
                        }
                    });

                    // Anima l'header
                    tl.to(headerRef.current, {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    });

                    // Anima la barra di ricerca
                    tl.to(searchBarRef.current, {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    }, "-=0.2");

                    // Anima le card dei lavori con stagger
                    tl.to(cardGridRef.current.children, {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        stagger: 0.05,
                        ease: "back.out(1.2)"
                    }, "-=0.2");
                }

                return () => {
                    gsap.killTweensOf("*");
                };
            }, [hasAnimated, lavori]);

            // Animazione per il modal quando viene aperto
            useEffect(() => {
                if (isDialogOpen && modalContentRef.current) {
                    gsap.fromTo(
                        modalContentRef.current,
                        {y: 20, opacity: 0, scale: 0.98},
                        {y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power2.out"}
                    );
                }
            }, [isDialogOpen]);

            // Animazione per nuove card quando cambiano i lavori filtrati
            useEffect(() => {
                if (hasAnimated && cardGridRef.current && cardGridRef.current.children.length > 0) {
                    // Anima solo le nuove card, non tutte
                    gsap.fromTo(
                        cardGridRef.current.children,
                        {
                            opacity: (i, el) => el.getAttribute("data-animated") === "true" ? 1 : 0,
                            y: (i, el) => el.getAttribute("data-animated") === "true" ? 0 : 20,
                            scale: (i, el) => el.getAttribute("data-animated") === "true" ? 1 : 0.97,
                        },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.3,
                            stagger: 0.03,
                            ease: "power1.out",
                            onComplete: () => {
                                Array.from(cardGridRef.current!.children).forEach(child => {
                                    child.setAttribute("data-animated", "true");
                                });
                            }
                        }
                    );
                }
            }, [filteredLavori, hasAnimated]);

            // Animazione per il modal di conferma eliminazione
            useEffect(() => {
                if (isDeleteDialogOpen && deleteDialogRef.current) {
                    gsap.fromTo(
                        deleteDialogRef.current,
                        {scale: 0.9, opacity: 0},
                        {scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.5)"}
                    );
                }
            }, [isDeleteDialogOpen]);

            const fetchLavori = async (id: number) => {
                setLoading(true);
                try {
                    const res = await fetch(`https://api.stackhorizon.it/sh/getLavori/${id}`, {
                        method: "GET",
                        headers: {"Content-Type": "application/json"},
                        credentials: "include",
                    });
                    if (!res.ok) throw new Error("Errore nella fetch GET");
                    const data = await res.json();
                    setLavori(data.data);
                } catch (error) {
                    toast({title: "Errore durante il caricamento dei lavori", variant: "destructive"});
                } finally {
                    setLoading(false);
                }
            }

            const handleBack = () => {
                // Animazione di uscita
                if (headerRef.current && cardGridRef.current) {
                    const tl = gsap.timeline({
                        onComplete: () => {
                            navigate('/clienti');
                        }
                    });

                    tl.to(cardGridRef.current.children, {
                        y: 30,
                        opacity: 0,
                        scale: 0.95,
                        stagger: 0.03,
                        duration: 0.3,
                        ease: "power2.in"
                    });

                    tl.to(headerRef.current, {
                        y: -20,
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.in"
                    }, "-=0.2");
                } else {
                    navigate('/clienti');
                }
            };

            const handleAddLavoro = () => {
                setEditingLavoro(null);
                setFormData({titolo: '', descrizione: '', stato: 'in corso'});
                setIsDialogOpen(true);

                // Animazione pulsante
                const button = document.querySelector('button[aria-haspopup="dialog"]');
                if (button) {
                    gsap.fromTo(
                        button,
                        {scale: 1},
                        {
                            scale: 0.95,
                            duration: 0.1,
                            yoyo: true,
                            repeat: 1,
                            ease: "power1.out"
                        }
                    );
                }
            };

            const handleEditLavoro = (lavoro: Lavoro) => {
                setEditingLavoro(lavoro);
                setFormData({
                    titolo: lavoro.titolo,
                    descrizione: lavoro.descrizione,
                    stato: lavoro.stato
                });
                setIsDialogOpen(true);
            };

            const handleSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setLoading(true);

                // Animazione del pulsante al click
                if (formRef.current) {
                    const button = formRef.current.querySelector('button[type="submit"]');
                    if (button) {
                        gsap.to(button, {
                            scale: 0.95,
                            duration: 0.1,
                            yoyo: true,
                            repeat: 1
                        });
                    }
                }

                if (editingLavoro) {
                    try {
                        const response = await fetch(`https://api.stackhorizon.it/sh/updateLavoro/${editingLavoro.id}`, {
                            method: "PATCH",
                            headers: {"Content-Type": "application/json"},
                            credentials: "include",
                            body: JSON.stringify(formData),
                        });

                        const data = await response.json();

                        if (response.ok) {
                            await fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
                            toast({
                                title: "Lavoro aggiornato con successo",
                                variant: "default"
                            });
                        } else {
                            toast({
                                title: data.message || "Errore durante l'aggiornamento",
                                variant: "destructive"
                            });
                        }
                    } catch (error) {
                        toast({
                            title: "Errore durante la richiesta",
                            variant: "destructive"
                        });
                    } finally {
                        setLoading(false);
                    }
                } else {
                    try {
                        const res = await fetch("https://api.stackhorizon.it/sh/addLavoro", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            credentials: "include",
                            body: JSON.stringify({...formData, idCliente: sessionStorage.getItem("clienteId")}),
                        });
                        if (!res.ok) throw new Error("Errore nella fetch POST");
                        const data = await res.json();
                        await fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
                        toast({
                            title: "Lavoro aggiunto con successo",
                            variant: "default"
                        });
                    } catch (error) {
                        toast({
                            title: "Errore durante la richiesta",
                            variant: "destructive"
                        });
                    } finally {
                        setLoading(false);
                    }
                }

                setIsDialogOpen(false);
                setFormData({titolo: '', descrizione: '', stato: 'in corso'});
                setEditingLavoro(null);
            };

            const confirmDeleteLavoro = (id: string) => {
                setLavoroToDelete(id);
                setIsDeleteDialogOpen(true);
            };

            const handleDeleteLavoro = async () => {
                if (!lavoroToDelete) return;

                setIsDeleting(true);
                try {
                    const response = await fetch(`https://api.stackhorizon.it/sh/deleteLavoro/${lavoroToDelete}`, {
                        method: "DELETE",
                        headers: {"Content-Type": "application/json"},
                        credentials: "include",
                    });

                    const data = await response.json();
                    if (response.ok) {
                        // Animazione di eliminazione
                        const cardToRemove = Array.from(cardGridRef.current?.children || []).find(
                            (card) => card.getAttribute("data-id") === lavoroToDelete
                        );

                        if (cardToRemove) {
                            gsap.to(cardToRemove, {
                                opacity: 0,
                                y: -20,
                                scale: 0.9,
                                duration: 0.3,
                                onComplete: () => {
                                    fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
                                    setIsDeleteDialogOpen(false);
                                    setLavoroToDelete(null);
                                }
                            });
                        } else {
                            await fetchLavori(parseInt(sessionStorage.getItem("clienteId") || '0'));
                            setIsDeleteDialogOpen(false);
                            setLavoroToDelete(null);
                        }

                        toast({
                            title: "Lavoro eliminato con successo",
                            variant: "default"
                        });
                    } else {
                        toast({
                            title: data.message || "Errore durante l'eliminazione",
                            variant: "destructive"
                        });
                        setIsDeleteDialogOpen(false);
                        setLavoroToDelete(null);
                    }
                } catch (error) {
                    toast({
                        title: "Errore durante la richiesta",
                        variant: "destructive"
                    });
                    setIsDeleteDialogOpen(false);
                    setLavoroToDelete(null);
                } finally {
                    setIsDeleting(false);
                }
            };

            const handleLavoroClick = (lavoroId: string) => {
                sessionStorage.setItem("lavoroId", lavoroId);

                // Animazione prima di navigare
                if (cardGridRef.current) {
                    gsap.to(cardGridRef.current.children, {
                        y: -20,
                        opacity: 0,
                        stagger: 0.03,
                        duration: 0.3,
                        ease: "power2.in",
                        onComplete: () => navigate("/pagamenti")
                    });
                } else {
                    navigate("/pagamenti");
                }
            };

            const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;

                // Piccola animazione della barra di ricerca
                if (searchBarRef.current) {
                    gsap.to(searchBarRef.current, {
                        scale: 1.02,
                        duration: 0.15,
                        yoyo: true,
                        repeat: 1,
                        ease: "power1.out"
                    });
                }

                setSearchTerm(value);
            };

            const getStatoColor = (stato: Lavoro['stato']) => {
                switch (stato) {
                    case 'completato':
                        return 'from-green-500 to-emerald-600';
                    case 'in corso':
                        return 'from-blue-500 to-indigo-600';
                    case 'sospeso':
                        return 'from-yellow-500 to-amber-600';
                    case 'annullato':
                        return 'from-red-500 to-rose-600';
                    default:
                        return 'from-gray-500 to-slate-600';
                }
            };

            const getStatoBadgeColor = (stato: Lavoro['stato']) => {
                switch (stato) {
                    case 'completato':
                        return 'bg-green-100 text-green-800 border-green-200';
                    case 'in corso':
                        return 'bg-blue-100 text-blue-800 border-blue-200';
                    case 'sospeso':
                        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    case 'annullato':
                        return 'bg-red-100 text-red-800 border-red-200';
                    default:
                        return 'bg-gray-100 text-gray-800 border-gray-200';
                }
            };

            const getStatoIcon = (stato: Lavoro['stato']) => {
                switch (stato) {
                    case 'completato':
                        return <CheckCircle2 className="h-4 w-4"/>;
                    case 'in corso':
                        return <ClipboardList className="h-4 w-4"/>;
                    case 'sospeso':
                        return <AlertCircle className="h-4 w-4"/>;
                    case 'annullato':
                        return <Trash2 className="h-4 w-4"/>;
                    default:
                        return <ClipboardList className="h-4 w-4"/>;
                }
            };

            const getStatoLabel = (stato: Lavoro['stato']) => {
                switch (stato) {
                    case 'completato':
                        return 'Completato';
                    case 'in corso':
                        return 'In Corso';
                    case 'sospeso':
                        return 'Sospeso';
                    case 'annullato':
                        return 'Annullato';
                    default:
                        return stato;
                }
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
                                        <span>Torna ai Clienti</span>
                                    </Button>
                                    <div
                                        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                        <Building2 className="h-5 w-5 text-white"/>
                                    </div>
                                    <h1 className="text-xl font-semibold text-slate-800">Gestione Lavori</h1>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Titolo e pulsante di aggiunta */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <ClipboardList className="h-6 w-6 text-indigo-600"/>
                                    Lavori e Progetti
                                </h2>
                                <p className="text-slate-500 mt-1">
                                    {filteredLavori.length} {filteredLavori.length !== 1 ? 'lavori' : 'lavoro'} in corso
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Barra di ricerca */}
                                <div
                                    ref={searchBarRef}
                                    className="relative"
                                >
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                                    <Input
                                        placeholder="Cerca lavoro..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="pl-10 bg-white/70 backdrop-blur-sm border-slate-200 w-full sm:w-64 focus:w-full sm:focus:w-80 transition-all duration-300"
                                    />
                                </div>

                                {/* Pulsante aggiungi */}
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            onClick={handleAddLavoro}
                                            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md transition-all duration-200 flex items-center gap-2"
                                            disabled={loading}
                                        >
                                            <Plus className="h-4 w-4"/>
                                            Nuovo Lavoro
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent
                                        className="p-0 overflow-hidden border-0 shadow-2xl sm:max-w-md"
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

                                            <div className="relative z-10 p-6">
                                                <DialogHeader className="pb-2">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <div
                                                            className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                                            <ClipboardList className="h-5 w-5 text-white"/>
                                                        </div>
                                                        <DialogTitle
                                                            className="text-xl font-semibold text-slate-800">
                                                            {editingLavoro ? 'Modifica Lavoro' : 'Nuovo Lavoro'}
                                                        </DialogTitle>
                                                    </div>
                                                    <DialogDescription className="text-slate-500">
                                                        {editingLavoro
                                                            ? 'Aggiorna i dettagli del lavoro compilando il modulo sottostante.'
                                                            : 'Aggiungi un nuovo lavoro compilando il modulo sottostante.'}
                                                    </DialogDescription>
                                                </DialogHeader>

                                                <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 mt-5">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="titolo"
                                                               className="text-slate-700 font-medium">Titolo</Label>
                                                        <Input
                                                            id="titolo"
                                                            value={formData.titolo}
                                                            onChange={(e) => setFormData({...formData, titolo: e.target.value})}
                                                            required
                                                            placeholder="Inserisci il titolo del lavoro"
                                                            className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                            disabled={loading}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="descrizione"
                                                               className="text-slate-700 font-medium">Descrizione</Label>
                                                        <Textarea
                                                            id="descrizione"
                                                            value={formData.descrizione}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                descrizione: e.target.value
                                                            })}
                                                            required
                                                            rows={3}
                                                            placeholder="Descrivi il lavoro da svolgere"
                                                            className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                            disabled={loading}
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="stato"
                                                               className="text-slate-700 font-medium">Stato</Label>
                                                        <Select value={formData.stato}
                                                                onValueChange={(value: Lavoro['stato']) => setFormData({
                                                                    ...formData,
                                                                    stato: value
                                                                })}
                                                                disabled={loading}>
                                                            <SelectTrigger
                                                                className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200">
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="in corso">In Corso</SelectItem>
                                                                <SelectItem value="completato">Completato</SelectItem>
                                                                <SelectItem value="sospeso">Sospeso</SelectItem>
                                                                <SelectItem value="annullato">Annullato</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-2">
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
                                                                    {editingLavoro ? 'Aggiorna' : 'Aggiungi'}
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
                        </div>

                        {/* Dialog di conferma eliminazione */}
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogContent className="p-0 overflow-hidden border-0 shadow-xl sm:max-w-sm">
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

                                    <div className="relative z-10 p-6">
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
                                                Sei sicuro di voler eliminare questo lavoro?
                                                Questa azione non può essere annullata e tutti i dati associati saranno persi.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <DialogFooter className="flex justify-end gap-3 pt-6">
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
                                                onClick={handleDeleteLavoro}
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
                                                        Elimina lavoro
                                                    </div>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {loading && lavori.length === 0 ? (
                            <div className="flex justify-center py-32">
                                <div className="flex flex-col items-center">
                                    <svg className="animate-spin h-12 w-12 text-indigo-600 mb-3"
                                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-slate-500 text-lg">Caricamento lavori...</p>
                                </div>
                            </div>
                        ) : filteredLavori.length === 0 ? (
                            <div
                                className="bg-white/30 backdrop-blur-md border border-slate-200/50 rounded-xl p-12 text-center">
                                <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4"/>
                                <h3 className="text-xl font-medium text-slate-700 mb-2">Nessun lavoro trovato</h3>
                                <p className="text-slate-500 mb-6">
                                    {searchTerm ? "Nessun risultato per la ricerca. Prova con altri termini." : "Non ci sono ancora lavori registrati. Aggiungine uno nuovo!"}
                                </p>
                                {!searchTerm && (
                                    <Button
                                        onClick={handleAddLavoro}
                                        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Nuovo Lavoro
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div
                                ref={cardGridRef}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredLavori.map((lavoro) => (
                                    <Card
                                        key={lavoro.id}
                                        data-id={lavoro.id}
                                        className="group overflow-hidden transition-all duration-300 hover:shadow-lg bg-white/30 backdrop-blur-md border border-white/40 relative"
                                    >
                                        {/* Effetto acrilico con riflesso */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                                        <div
                                            className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                                        {/* Indicatore di stato (bordo superiore colorato) */}
                                        <div
                                            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatoColor(lavoro.stato)} z-10`}></div>

                                        <CardHeader className="pb-2 relative">
                                            <CardTitle className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-semibold text-slate-800 truncate">
                                                        {lavoro.titolo.length > 20 ? `${lavoro.titolo.substring(0, 20)}...` : lavoro.titolo}
                                                    </span>
                                                    <span
                                                        className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-flex items-center gap-1 max-w-fit ${getStatoBadgeColor(lavoro.stato)}`}>
                                                        {getStatoIcon(lavoro.stato)}
                                                        {getStatoLabel(lavoro.stato)}
                                                    </span>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditLavoro(lavoro);
                                                        }}
                                                        disabled={loading}
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50/50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            confirmDeleteLavoro(lavoro.id);
                                                        }}
                                                        disabled={loading}
                                                    >
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="pb-0">
                                            <p className="text-slate-600 text-sm line-clamp-3">
                                                {lavoro.descrizione}
                                            </p>
                                        </CardContent>

                                        <CardFooter className="pt-4 pb-4">
                                            <Button
                                                className="w-full bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-purple-600/90 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                                                onClick={() => handleLavoroClick(lavoro.id)}
                                                disabled={loading}
                                            >
                                                <span>Gestisci Pagamenti</span>
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            );
        };

        export default Lavori;