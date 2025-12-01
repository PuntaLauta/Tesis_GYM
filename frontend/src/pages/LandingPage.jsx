import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CAROUSEL_IMAGES = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1920&auto=format&fit=crop"
];

export default function LandingPage() {
    const [currentIndex, setCurrentIndex] = useState(CAROUSEL_IMAGES.length);
    const [itemsPerPage, setItemsPerPage] = useState(3);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const carouselRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            if (carouselRef.current) {
                setContainerWidth(carouselRef.current.offsetWidth);
            }
            if (window.innerWidth < 640) {
                setItemsPerPage(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(3);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Duplicar imágenes para efecto infinito (3 copias)
    const duplicatedImages = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];

    const nextSlide = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        const next = currentIndex + 1;

        setCurrentIndex(next);

        if (next >= CAROUSEL_IMAGES.length * 2) {
            // Reset position after transition
            setTimeout(() => {
                setIsTransitioning(false);
                setCurrentIndex(CAROUSEL_IMAGES.length);
            }, 500);
        } else {
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    const prevSlide = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        const next = currentIndex - 1;

        setCurrentIndex(next);

        if (next < CAROUSEL_IMAGES.length) {
            // Reset position after transition
            setTimeout(() => {
                setIsTransitioning(false);
                setCurrentIndex(CAROUSEL_IMAGES.length * 2 - 1);
            }, 500);
        } else {
            setTimeout(() => setIsTransitioning(false), 500);
        }
    };

    // Calculate dimensions
    const gap = 16; // 1rem = 16px
    const totalGapSpace = (itemsPerPage - 1) * gap;
    const availableWidth = containerWidth - totalGapSpace;
    const itemWidth = availableWidth > 0 ? availableWidth / itemsPerPage : 0;
    const stride = itemWidth + gap;
    const currentTranslate = -(currentIndex * stride);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center lg:pt-32">
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-6xl">
                            <span className="block">Gestión inteligente</span>{' '}
                            <span className="block text-blue-600">para tu gimnasio</span>
                        </h1>
                        <p className="mt-4 text-base text-gray-500 sm:mt-6 sm:text-lg md:text-xl lg:text-2xl mx-auto">
                            La plataforma todo en uno que conecta a administradores, entrenadores y clientes.
                            Simplifica la gestión, optimiza tus rutinas y lleva tu entrenamiento al siguiente nivel.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <div className="rounded-md shadow">
                                <Link
                                    to="/login"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg transition-transform transform hover:scale-105"
                                >
                                    Ingresar
                                </Link>
                            </div>
                            <div>
                                <a
                                    href="#features"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg transition-colors"
                                >
                                    Saber más
                                </a >
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Carousel Section */}
            <section className="w-full bg-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 uppercase tracking-wide">
                        Nuestras Instalaciones
                    </h2>
                    <div className="relative">
                        {/* Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none transition-colors"
                            aria-label="Previous slide"
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none transition-colors"
                            aria-label="Next slide"
                        >
                            <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Images Container */}
                        <div className="overflow-hidden" ref={carouselRef}>
                            <div
                                className="flex"
                                style={{
                                    transform: `translateX(${currentTranslate}px)`,
                                    transition: isTransitioning ? 'transform 0.5s ease-in-out' : 'none',
                                    gap: `${gap}px`
                                }}
                            >
                                {duplicatedImages.map((img, index) => (
                                    <div
                                        key={`carousel-img-${index}`}
                                        className="flex-shrink-0 h-64 sm:h-80 rounded-lg overflow-hidden shadow-md"
                                        style={{
                                            width: `${itemWidth}px`
                                        }}
                                    >
                                        <img
                                            src={img}
                                            alt="Gym facility"
                                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 bg-gray-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center animate-fade-in-up delay-300">
                        <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Características</h2>
                        <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Todo lo que necesitas en un solo lugar
                        </p>
                        <p className="max-w-2xl mt-5 mx-auto text-xl text-gray-500">
                            Diseñado tanto para la administración eficiente del gimnasio como para la mejor experiencia del cliente.
                        </p>
                    </div>

                    <div className="mt-16">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Feature 1: Gestión de Socios */}
                            <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 p-8 animate-fade-in-up delay-100">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Gestión de Socios</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Administra perfiles, membresías y estados de cuenta de todos los asistentes de forma centralizada.
                                </p>
                            </div>

                            {/* Feature 2: Rutinas Personalizadas */}
                            <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 p-8 animate-fade-in-up delay-200">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Rutinas y Seguimiento</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Crea y asigna rutinas personalizadas. Los clientes pueden ver sus ejercicios y registrar su progreso.
                                </p>
                            </div>

                            {/* Feature 3: Control de Acceso QR */}
                            <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 p-8 animate-fade-in-up delay-300">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Acceso Rápido con QR</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Entrada sin contacto. Genera códigos QR únicos para cada socio y agiliza el ingreso al gimnasio.
                                </p>
                            </div>

                            {/* Feature 4: Reserva de Clases */}
                            <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 p-8 animate-fade-in-up delay-100">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Reserva de Clases</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Sistema de reservas online para clases grupales. Evita cupos llenos y organiza mejor los horarios.
                                </p>
                            </div>

                            {/* Feature 5: Gestión de Staff */}
                            <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 p-8 animate-fade-in-up delay-200">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Instructores y Staff</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Coordina a tu equipo de entrenadores, asigna horarios y mantén el control de tu personal.
                                </p>
                            </div>

                            {/* Feature 6: Reportes y Métricas */}
                            <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 p-8 animate-fade-in-up delay-300">
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-5">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Reportes Detallados</h3>
                                <p className="mt-2 text-base text-gray-500">
                                    Visualiza el rendimiento de tu gimnasio con reportes de asistencia, ingresos y actividad.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contactar-ventas" className="bg-white py-16 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">
                        ¿Te gusta lo que ves?
                    </h2>
                    <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
                        Pongámonos en contacto para implementar esta solución en tu gimnasio.
                        Personalizamos la experiencia para adaptarnos a tus necesidades.
                    </p>
                    <div className="flex justify-center">
                        <a
                            href="mailto:ventas@gestiongym.com"
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg transition-colors shadow-lg hover:shadow-xl"
                        >
                            Contactar Ventas
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-700">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        <span className="block">¿Listo para empezar?</span>
                        <span className="block text-blue-200">Únete a la comunidad hoy mismo.</span>
                    </h2>
                    <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                        <div className="inline-flex rounded-md shadow">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
