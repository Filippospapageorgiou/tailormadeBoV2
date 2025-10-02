export const progress = $state({
    show: false,
    progress: 0,
    text: 'Loading...'
});

let interval: ReturnType<typeof setInterval>;

export function showProgress(text = 'Processing...') {
    progress.show = true;
    progress.text = text;
    progress.progress = 0;

    // Simulate a loading animation for indeterminate state
    clearInterval(interval);
    interval = setInterval(() => {
        progress.progress = (progress.progress + 5) % 100;
    }, 200);
}

export function hideProgress() {
    clearInterval(interval);
    progress.show = false;
    progress.progress = 0;
    progress.text = 'Loading...';
}
