<script lang="ts">
  import { enhance } from '$app/forms';
  import { Pencil, Save, X, Building, Phone, MapPin, Globe, CheckCircle, XCircle } from 'lucide-svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';

  let { data, form } = $props();

  let profile = $derived(data.profile);
  let organization = $derived(data.organization);

  let editingUsername = $state(false);

  let username = $state('');
  let avatar_url = $state('');

  $effect(() => {
        username = profile.username;
        avatar_url = profile.image_url;
  })

  let avatarFile = $state<File | null>(null);

  function handleAvatarClick() {
    const fileInput = document.getElementById('avatar-upload');
    fileInput?.click();
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      avatarFile = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        avatar_url = e.target?.result as string;
      };
      reader.readAsDataURL(avatarFile);
      
      // Automatically submit the form when a file is selected
      const submitButton = document.getElementById('avatar-submit');
      submitButton?.click();
    }
  }
</script>

<div class="p-4 md:p-8 space-y-8">
  <Card.Root class="overflow-hidden">
    <Card.Header class="py-4">
        <div class="flex items-end">
        <div class="relative group">
          <Avatar.Root class="w-32 h-32 border-4 border-background">
            <Avatar.Image src={avatar_url} alt={username} />
            <Avatar.Fallback>{username?.charAt(0)}</Avatar.Fallback>
          </Avatar.Root>
          <Button
            variant="outline"
            size="icon"
            class="absolute bottom-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onclick={handleAvatarClick}
          >
            <Pencil class="w-4 h-4" />
          </Button>
          <form method="POST" use:enhance action="?/updateAvatar" class="hidden">
            <Input type="file" id="avatar-upload" name="avatar" onchange={handleFileChange} accept="image/*" />
            <Button type="submit" id="avatar-submit">Submit</Button>
          </form>
        </div>
        <div class="ml-4">
          {#if editingUsername}
            <form method="POST" use:enhance action="?/updateUsername" class="flex items-center gap-2">
              <Input name="username" bind:value={username} class="text-2xl font-bold" />
              <Button type="submit" size="icon" variant="ghost"><Save class="w-5 h-5" /></Button>
              <Button type="button" size="icon" variant="ghost" onclick={() => editingUsername = false}><X class="w-5 h-5" /></Button>
            </form>
          {:else}
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold">{profile.username}</h1>
              <Button type="button" size="icon" variant="ghost" onclick={() => editingUsername = true}><Pencil class="w-5 h-5" /></Button>
            </div>
          {/if}
          <p class="text-muted-foreground">{profile.email}</p>
        </div>
        <div class="ml-auto">
          <Badge>{profile.role}</Badge>
        </div>
      </div>
    </Card.Header>
    <Card.Content class="p-6 pt-0">
      
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Building class="w-6 h-6" />
        Organization Details
      </Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
      <div class="flex items-center gap-4">
        <Building class="w-5 h-5 text-muted-foreground" />
        <div class="flex-1 flex justify-between items-center">
          <span class="font-medium">Store Name</span>
          <span class="text-muted-foreground">{organization.store_name || 'N/A'}</span>
        </div>
      </div>
      <Separator />
      <div class="flex items-center gap-4">
        <Phone class="w-5 h-5 text-muted-foreground" />
        <div class="flex-1 flex justify-between items-center">
          <span class="font-medium">Phone</span>
          <span class="text-muted-foreground">{organization.phone || 'N/A'}</span>
        </div>
      </div>
      <Separator />
      <div class="flex items-center gap-4">
        <Globe class="w-5 h-5 text-muted-foreground" />
        <div class="flex-1 flex justify-between items-center">
          <span class="font-medium">Country</span>
          <span class="text-muted-foreground">{organization.country || 'N/A'}</span>
        </div>
      </div>
      <Separator />
      <div class="flex items-center gap-4">
        <MapPin class="w-5 h-5 text-muted-foreground" />
        <div class="flex-1 flex justify-between items-center">
          <span class="font-medium">Location</span>
          <span class="text-muted-foreground">{organization.location || 'N/A'}</span>
        </div>
      </div>
      <Separator />
      <div class="flex items-center gap-4">
        {#if organization.status}
            <CheckCircle class="w-5 h-5 text-green-500" />
        {:else}
            <XCircle class="w-5 h-5 text-red-500" />
        {/if}
        <div class="flex-1 flex justify-between items-center">
          <span class="font-medium">Status</span>
          <span class:text-green-500={organization.status} class:text-red-500={!organization.status}>
            {organization.status ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</div>




