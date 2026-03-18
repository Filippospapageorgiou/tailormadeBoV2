export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
	if (typeof navigator === 'undefined') return 'desktop';
	const ua = navigator.userAgent.toLowerCase();
	if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
	if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
	return 'desktop';
}
