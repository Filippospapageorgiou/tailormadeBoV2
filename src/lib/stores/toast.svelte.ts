export const toast = $state({
    title: '',
    text:'',
    status:false,
    show:false
})

export function showSuccessToast(title:string, text:string){
    toast.title = title;
    toast.text = text;
    toast.status = true;
    toast.show = true;
}

export function showFailToast(title:string, text:string){
    toast.title = title;
    toast.text = text;
    toast.status = false;
    toast.show = true;
}