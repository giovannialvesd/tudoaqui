import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

import { handleFirestoreError, OperationType } from '../firebase/errors';

export interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  logo?: string;
  banner?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'active' | 'inactive';
}

interface CityContextType {
  cities: City[];
  currentCity: City | null;
  setCurrentCityBySlug: (slug: string) => Promise<void>;
  loading: boolean;
  cityName: string;
  temperature: string | null;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState('Buscando localização...');
  const [temperature, setTemperature] = useState<string | null>(null);

  // Shared location/weather logic
  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather?.temperature) {
          setTemperature(`${Math.round(data.current_weather.temperature)}°C`);
        }
      } catch (e) {
        console.error('Weather error:', e);
      }
    };
    
    const fetchCityName = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
          headers: {
            'User-Agent': 'TudoAqui-LocalApp/1.0'
          }
        });
        const data = await res.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county || 'Sua Localização';
        const state = address.state || '';
        setCityName(state ? `${city}, ${state}` : city);
      } catch (e) {
        setCityName('Localização Ativa');
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeather(lat, lon);
          fetchCityName(lat, lon);
        },
        () => {
          setCityName('Localização Indisponível');
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 3600000 } // Cache for 1 hour
      );
    }
  }, []);

  useEffect(() => {
    if (currentCity) {
      setCityName(`${currentCity.name}, ${currentCity.state}`);
    }
  }, [currentCity]);

  useEffect(() => {
    const q = query(collection(db, 'cities'), where('active', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const citiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as City[];
      setCities(citiesData);
      
      // Load current city from localStorage or default to first city if none set
      const savedCitySlug = localStorage.getItem('current_city_slug');
      if (savedCitySlug) {
        const found = citiesData.find(c => c.slug === savedCitySlug);
        if (found) {
          setCurrentCity(found);
          localStorage.setItem('current_city_id', found.id);
        }
      } else if (citiesData.length > 0 && !currentCity) {
        // We don't auto-set if there's no saved one, let the user pick or land on home
      }
      
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'cities'));

    return () => unsubscribe();
  }, []);

  const setCurrentCityBySlug = async (slug: string) => {
    const found = cities.find(c => c.slug === slug);
    if (found) {
      setCurrentCity(found);
      localStorage.setItem('current_city_slug', slug);
      localStorage.setItem('current_city_id', found.id);
    } else {
      // If not in memory yet, try fetching from Firestore
      const q = query(collection(db, 'cities'), where('slug', '==', slug), where('status', '==', 'active'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cityData = { id: snap.docs[0].id, ...snap.docs[0].data() } as City;
        setCurrentCity(cityData);
        localStorage.setItem('current_city_slug', slug);
        localStorage.setItem('current_city_id', cityData.id);
      }
    }
  };

  return (
    <CityContext.Provider value={{ cities, currentCity, setCurrentCityBySlug, loading, cityName, temperature }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};
