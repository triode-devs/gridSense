import { API_BASE_URL } from '$lib/index.js';

export async function load({ fetch }) {
    try {
        const res = await fetch(`${API_BASE_URL}/transformer`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        
        // Enhance data if needed for the global view
        // In a real app, this might fetch more detailed topology
        return {
            gridData: data.success ? data.data : []
        };
    } catch (e) {
        return {
            gridData: []
        };
    }
}
