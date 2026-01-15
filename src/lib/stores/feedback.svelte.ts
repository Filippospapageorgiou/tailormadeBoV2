export const openFeedBackModal = $state({
    open: false
})

export function openModal(){
    openFeedBackModal.open = true;
}

export function closeModal(){
    openFeedBackModal.open = false;
}
