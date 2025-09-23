export interface Blog {
    id:number;
    title:string;
    description:string;
    content:string;
    images:string[];
    tags:string[];
    author_id:string;
    published:boolean;
    created_at:string;
    updated_at:string;
    profile: {
        username:string;
        image_url:string;
    }
}