import React from 'react';
import Autocomplete from 'react-google-autocomplete';
import { MapPin } from 'lucide-react';

const LocationInput = ({ value, onChange, placeholder = "Location (e.g. San Francisco, CA)", style }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div style={{ position: 'relative', ...style }}>
        <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input" 
          placeholder={placeholder}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
      <Autocomplete
        apiKey={apiKey}
        onPlaceSelected={(place) => {
          if (place && place.formatted_address) {
            onChange(place.formatted_address);
          } else if (place && place.name) {
            onChange(place.name);
          }
        }}
        options={{
          types: ['(regions)'],
        }}
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        placeholder={placeholder}
        style={{ paddingLeft: '2.5rem', width: '100%' }}
      />
    </div>
  );
};

export default LocationInput;
