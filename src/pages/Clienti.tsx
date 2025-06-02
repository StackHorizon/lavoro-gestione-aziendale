import React, {useState, useEffect, useRef} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardHeader, CardTitle, CardFooter} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Plus,
    LogOut,
    Trash2,
    Edit,
    Search,
    Building2,
    User,
    Mail,
    Phone,
    ArrowRight,
    Users,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import {toast} from "@/hooks/use-toast";
import gsap from "gsap";

interface Cliente {
    id: string;
    nome: string;
    cognome: string;
    email: string;
    cellulare: string;
}

const Clienti = () => {
    const {isAuthenticated, logout} = useAuth();
    const navigate = useNavigate();
    const [clienti, setClienti] = useState<Cliente[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [formData, setFormData] = useState({
        nome: "",
        cognome: "",
        email: "",
        cellulare: "",
    });
    const [isLoading, setIsLoading] = useState(false);
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

    // Filtra i clienti in base al termine di ricerca
    const filteredClienti = clienti.filter(
        cliente =>
            cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.cellulare.includes(searchTerm)
    );

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/");
            return;
        }
        fetchClienti();
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

            // Anima le card dei clienti con stagger
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
    }, [hasAnimated, clienti]);

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

    // Animazione per nuove card quando cambiano i clienti filtrati
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
    }, [filteredClienti, hasAnimated]);

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

    const fetchClienti = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("https://api.stackhorizon.it/sh/getClienti", {
                method: "GET",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });

            if (!response.ok) throw new Error("Errore nel caricamento dei clienti");

            const data = await response.json();
            setClienti(data.data);
        } catch (error) {
            toast({
                title: "Errore durante il caricamento dei clienti",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        // Animazione di uscita
        if (headerRef.current && cardGridRef.current) {
            const tl = gsap.timeline({
                onComplete: () => {
                    logout();
                    navigate("/");
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
            logout();
            navigate("/");
        }
    };

    const handleAddCliente = () => {
        setEditingCliente(null);
        setFormData({nome: "", cognome: "", email: "", cellulare: ""});
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

    const handleEditCliente = (cliente: Cliente) => {
        setEditingCliente(cliente);
        setFormData({
            nome: cliente.nome,
            cognome: cliente.cognome,
            email: cliente.email,
            cellulare: cliente.cellulare,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

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

        if (editingCliente) {
            try {
                const response = await fetch(`https://api.stackhorizon.it/sh/updateCliente/${editingCliente.id}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(formData),
                });

                const data = await response.json();
                if (response.ok) {
                    await fetchClienti();
                    toast({
                        title: "Cliente aggiornato con successo",
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
                setIsLoading(false);
            }
        } else {
            try {
                const response = await fetch("https://api.stackhorizon.it/sh/addCliente", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    body: JSON.stringify(formData),
                });

                const data = await response.json();
                if (response.ok) {
                    await fetchClienti();
                    toast({
                        title: "Cliente aggiunto con successo",
                        variant: "default"
                    });
                } else {
                    toast({
                        title: data.message || "Errore durante l'aggiunta",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                toast({
                    title: "Errore durante la richiesta",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        }

        setIsDialogOpen(false);
        setFormData({nome: "", cognome: "", email: "", cellulare: ""});
        setEditingCliente(null);
    };

    const confirmDeleteCliente = (id: string) => {
        setClientToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteCliente = async () => {
        if (!clientToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`https://api.stackhorizon.it/sh/deleteCliente/${clientToDelete}`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                credentials: "include",
            });

            const data = await response.json();
            if (response.ok) {
                // Animazione di eliminazione
                const cardToRemove = Array.from(cardGridRef.current?.children || []).find(
                    (card) => card.getAttribute("data-id") === clientToDelete
                );

                if (cardToRemove) {
                    gsap.to(cardToRemove, {
                        opacity: 0,
                        y: -20,
                        scale: 0.9,
                        duration: 0.3,
                        onComplete: () => {
                            fetchClienti();
                            setIsDeleteDialogOpen(false);
                            setClientToDelete(null);
                        }
                    });
                } else {
                    await fetchClienti();
                    setIsDeleteDialogOpen(false);
                    setClientToDelete(null);
                }

                toast({
                    title: "Cliente eliminato con successo",
                    variant: "default"
                });
            } else {
                toast({
                    title: data.message || "Errore durante l'eliminazione",
                    variant: "destructive"
                });
                setIsDeleteDialogOpen(false);
                setClientToDelete(null);
            }
        } catch (error) {
            toast({
                title: "Errore durante la richiesta",
                variant: "destructive"
            });
            setIsDeleteDialogOpen(false);
            setClientToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClienteClick = (clienteId: string) => {
        sessionStorage.setItem("clienteId", clienteId);

        // Animazione prima di navigare
        if (cardGridRef.current) {
            gsap.to(cardGridRef.current.children, {
                y: -20,
                opacity: 0,
                stagger: 0.03,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => navigate("/lavori")
            });
        } else {
            navigate("/lavori");
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
                            <div
                                className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                <Building2 className="h-5 w-5 text-white"/>
                            </div>
                            <h1 className="text-xl font-semibold text-slate-800">Gestione Lavori</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                disabled={isLoading}
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
                            <Users className="h-6 w-6 text-indigo-600"/>
                            Gestione Clienti
                        </h2>
                        <p className="text-slate-500 mt-1">
                            {filteredClienti.length} client{filteredClienti.length !== 1 ? 'i' : 'e'} in archivio
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
                                placeholder="Cerca cliente..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-10 bg-white/70 backdrop-blur-sm border-slate-200 w-full sm:w-64 focus:w-full sm:focus:w-80 transition-all duration-300"
                            />
                        </div>

                        {/* Pulsante aggiungi */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={handleAddCliente}
                                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md transition-all duration-200 flex items-center gap-2"
                                    disabled={isLoading}
                                >
                                    <Plus className="h-4 w-4"/>
                                    Nuovo Cliente
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
                                                    <User className="h-5 w-5 text-white"/>
                                                </div>
                                                <DialogTitle
                                                    className="text-xl font-semibold text-slate-800">
                                                    {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
                                                </DialogTitle>
                                            </div>
                                            <DialogDescription className="text-slate-500">
                                                {editingCliente
                                                    ? 'Aggiorna i dati del cliente compilando il modulo sottostante.'
                                                    : 'Aggiungi un nuovo cliente compilando il modulo sottostante.'}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 mt-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="nome"
                                                           className="text-slate-700 font-medium">Nome</Label>
                                                    <Input
                                                        id="nome"
                                                        value={formData.nome}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            nome: e.target.value
                                                        })}
                                                        required
                                                        placeholder="Mario"
                                                        className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="cognome"
                                                           className="text-slate-700 font-medium">Cognome</Label>
                                                    <Input
                                                        id="cognome"
                                                        value={formData.cognome}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            cognome: e.target.value
                                                        })}
                                                        required
                                                        placeholder="Rossi"
                                                        className="bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email"
                                                       className="text-slate-700 font-medium">Email</Label>
                                                <div className="relative">
                                                    <Mail
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            email: e.target.value
                                                        })}
                                                        required
                                                        placeholder="mario.rossi@example.com"
                                                        className="pl-10 bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="cellulare"
                                                       className="text-slate-700 font-medium">Cellulare</Label>
                                                <div className="relative">
                                                    <Phone
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                                                    <Input
                                                        id="cellulare"
                                                        value={formData.cellulare}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            cellulare: e.target.value
                                                        })}
                                                        required
                                                        placeholder="123 456 7890"
                                                        className="pl-10 bg-white/80 border-slate-200 focus:border-blue-300 focus:ring-blue-200"
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setIsDialogOpen(false)}
                                                    className="border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                                                    disabled={isLoading}
                                                >
                                                    Annulla
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white shadow-md"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
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
                                                            {editingCliente ? 'Aggiorna' : 'Aggiungi'}
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
                                        Sei sicuro di voler eliminare questo cliente?
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
                                        onClick={handleDeleteCliente}
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
                                                Elimina cliente
                                            </div>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {isLoading && clienti.length === 0 ? (
                    <div className="flex justify-center py-32">
                        <div className="flex flex-col items-center">
                            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-3"
                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-slate-500 text-lg">Caricamento clienti...</p>
                        </div>
                    </div>
                ) : filteredClienti.length === 0 ? (
                    <div
                        className="bg-white/30 backdrop-blur-md border border-slate-200/50 rounded-xl p-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4"/>
                        <h3 className="text-xl font-medium text-slate-700 mb-2">Nessun cliente trovato</h3>
                        <p className="text-slate-500 mb-6">
                            {searchTerm ? "Nessun risultato per la ricerca. Prova con altri termini." : "Non ci sono ancora clienti registrati. Aggiungine uno nuovo!"}
                        </p>
                        {!searchTerm && (
                            <Button
                                onClick={handleAddCliente}
                                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2"/>
                                Nuovo Cliente
                            </Button>
                        )}
                    </div>
                ) : (
                    <div
                        ref={cardGridRef}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredClienti.map((cliente) => (
                            <Card
                                key={cliente.id}
                                data-id={cliente.id}
                                className="group overflow-hidden transition-all duration-300 hover:shadow-lg bg-white/30 backdrop-blur-md border border-white/40 relative"
                            >
                                {/* Effetto acrilico con riflesso */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none"></div>
                                <div
                                    className="absolute inset-0 bg-gradient-to-tr from-blue-100/10 to-purple-100/10 mix-blend-overlay pointer-events-none"></div>

                                <CardHeader className="pb-2 relative">
                                    <CardTitle className="flex items-center justify-between">
                                            <span
                                                className="text-lg font-semibold text-slate-800 truncate">
                                                {cliente.nome} {cliente.cognome}
                                            </span>
                                        <div className="flex shrink-0 gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCliente(cliente);
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Edit className="h-4 w-4"/>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    confirmDeleteCliente(cliente.id);
                                                }}
                                                disabled={isLoading}
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="pb-0">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center text-slate-600">
                                            <Mail className="h-4 w-4 mr-2 text-indigo-500"/>
                                            <span className="truncate">{cliente.email}</span>
                                        </div>
                                        <div className="flex items-center text-slate-600">
                                            <Phone className="h-4 w-4 mr-2 text-indigo-500"/>
                                            <span>{cliente.cellulare}</span>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-4 pb-4">
                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-500/90 via-indigo-500/90 to-purple-600/90 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
                                        onClick={() => handleClienteClick(cliente.id)}
                                        disabled={isLoading}
                                    >
                                        <span>Gestisci Lavori</span>
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

export default Clienti;