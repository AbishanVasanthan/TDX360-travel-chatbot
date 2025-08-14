const axios = require('axios');
let amadeusToken = null;

async function getAmadeusToken(){
  if(amadeusToken) return amadeusToken;
  const url = 'https://test.api.amadeus.com/v1/security/oauth2/token';
  const params = new URLSearchParams();
  params.append('grant_type','client_credentials');
  params.append('client_id', process.env.AMADEUS_API_KEY);
  params.append('client_secret', process.env.AMADEUS_API_SECRET);
  const res = await axios.post(url, params.toString(), { headers: { 'Content-Type':'application/x-www-form-urlencoded' } });
  amadeusToken = res.data.access_token;
  return amadeusToken;
}

async function searchHotels({ cityCode, cityName, checkInDate, checkOutDate, adults=1, currency='USD' }){
  try{
    const token = await getAmadeusToken();
    const url = 'https://test.api.amadeus.com/v2/shopping/hotel-offers';
    const res = await axios.get(url, { params: { cityCode, checkInDate, checkOutDate, adults, currency }, headers: { Authorization: `Bearer ${token}` } });
    const offers = res.data.data || [];
    return offers.slice(0,8).map(o => ({
      name: o.hotel?.name || 'Unknown',
      address: (o.hotel?.address?.lines || []).join(', '),
      price: o.offers?.[0]?.price?.total || null,
      currency: o.offers?.[0]?.price?.currency || currency,
      provider_url: o.offers?.[0]?.self || null
    }));
  }catch(e){
    console.error('Hotel search error', e?.response?.data || e.message);
    return [];
  }
}

module.exports = { searchHotels };
