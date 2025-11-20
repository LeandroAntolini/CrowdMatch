import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Place, CheckIn } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { X } from 'lucide-react';

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    places: Place[];
    checkIns: CheckIn[];
    onMarkerClick: (placeId: string) => void;
    highlightedPlaceId?: string;
}

const containerStyle = {
    width: '100%',
    height: '100%',
};

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, places, checkIns, onMarkerClick, highlightedPlaceId }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    });

    const getCrowdCount = (placeId: string) => {
        return (checkIns || []).filter(ci => ci.placeId === placeId).length;
    };

    const highlightedMarkerIcon = React.useMemo(() => {
        if (!isLoaded) return undefined;
        return {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#EC4899', // Accent color
            fillOpacity: 1,
            strokeWeight: 0,
            rotation: 0,
            scale: 2,
            anchor: new window.google.maps.Point(12, 24),
        };
    }, [isLoaded]);

    const center = React.useMemo(() => {
        if (highlightedPlaceId) {
            const highlightedPlace = places.find(p => p.id === highlightedPlaceId);
            if (highlightedPlace) {
                return { lat: highlightedPlace.lat, lng: highlightedPlace.lng };
            }
        }
        return places.length > 0 
            ? { lat: places[0].lat, lng: places[0].lng }
            : { lat: -20.3194, lng: -40.3378 }; // Fallback to Vitória, ES
    }, [places, highlightedPlaceId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-up">
            <div className="relative bg-surface rounded-2xl w-full h-full max-w-4xl max-h-[90vh] text-center p-4">
                <button onClick={onClose} className="absolute top-2 right-2 text-text-secondary hover:text-white bg-surface rounded-full p-1 z-10">
                    <X size={24} />
                </button>
                
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={14}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            styles: [ // Dark mode styles
                                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
                                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
                                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                                { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                                { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
                                { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
                            ],
                        }}
                    >
                        {places.map(place => {
                            const isHighlighted = place.id === highlightedPlaceId;

                            if (isHighlighted) {
                                return (
                                    <MarkerF
                                        key={place.id}
                                        position={{ lat: place.lat, lng: place.lng }}
                                        title={place.name}
                                        icon={highlightedMarkerIcon}
                                        onClick={() => onMarkerClick(place.id)}
                                        zIndex={2}
                                    />
                                );
                            }

                            // Para todos os outros pinos (ou todos se nenhum estiver destacado)
                            return (
                                <MarkerF
                                    key={place.id}
                                    position={{ lat: place.lat, lng: place.lng }}
                                    title={place.name}
                                    label={{
                                        text: `${getCrowdCount(place.id)}`,
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                    }}
                                    onClick={() => onMarkerClick(place.id)}
                                    zIndex={1}
                                />
                            );
                        })}
                    </GoogleMap>
                ) : (
                    <LoadingSpinner message="Carregando mapa..." />
                )}
            </div>
        </div>
    );
};

export default MapModal;