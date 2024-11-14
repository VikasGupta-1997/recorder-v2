import { useEffect } from "react";

function PermissionsPage() {
    const askPermissions = async () => {
        let audioStream = null;
        let videoStream = null;

        // Check microphone permission separately
        const audioPermission = await navigator.permissions.query({ name: "microphone" } as any);
        if (audioPermission.state !== "granted") {
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (error) {
            } finally {
                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                    console.log("Microphone tracks stopped.");
                }
            }
        }

        // Check camera permission separately
        const videoPermission = await navigator.permissions.query({ name: "camera" } as any);
        if (videoPermission.state !== "granted") {
            try {
                videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch (error) {
            } finally {
                if (videoStream) {
                    videoStream.getTracks().forEach(track => track.stop());
                    console.log("Camera tracks stopped.");
                }
            }
        }
    };

    useEffect(() => {
        askPermissions();
    }, []);

    return null;
}

export default PermissionsPage;
