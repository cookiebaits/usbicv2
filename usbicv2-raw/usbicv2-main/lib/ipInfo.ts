import axios from "axios";

interface IPInfo {
    country: string;
    isVpn: boolean;
}

async function getIPInfo(ip: string): Promise<IPInfo> {
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        const data = response.data;
        const country = data.countryCode || "Unknown";
        const isVpn = data.proxy || false;
        return { country, isVpn };
    } catch (error) {
        console.error("Error fetching IP info:", error);
        return { country: "Unknown", isVpn: false };
    }
}

export { getIPInfo };