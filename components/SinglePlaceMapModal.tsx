import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Place } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { X } from 'lucide-react';

interface SinglePlaceMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    place: Place;
}

const containerStyle = {
    width: '100%',
    height: '100%',
};

// Custom SVG for the marker icon in the app's accent color
const customMarkerIcon = {
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    fillColor: '#EC4899', // Accent color
    fillOpacity: 1,
    strokeWeight: 0,
    rotation: 0,
    scale: 2,
    anchor: new window.google.maps.Point(12, 24),
};


const SinglePlaceMapModal: React.FC<SinglePlaceMapModalProps> = ({ isOpen, onClose, place }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script-single',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
    });

    if (!isOpen) return null;

    const center = { lat: place.lat, lng: place.lng };

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
                        zoom={15}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: true,
                            styles: [ // Dark mode styles from the other map
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
                        <MarkerF
                            key={place.id}
                            position={{ lat: place.lat, lng: place.lng }}
                            title={place.name}
                            icon={customMarkerIcon}
                        />
                    </GoogleMap>
                ) : (
                    <LoadingSpinner message="Carregando mapa..." />
                )}
            </div>
        </div>
    );
};

export default SinglePlaceMapModal;