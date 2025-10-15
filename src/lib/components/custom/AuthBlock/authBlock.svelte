<script lang="ts">
  import * as Empty from "$lib/components/ui/empty/index.js";
  import { Spinner } from "$lib/components/ui/spinner/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
</script>
 
<Empty.Root class="w-full">
  <Empty.Header>
    <Empty.Media variant="icon">
      <Spinner />
    </Empty.Media>
    <Empty.Title>Authenticating</Empty.Title>
    <Empty.Description>
      Please wait while we verify your credentials...
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
  </Empty.Content>
</Empty.Root>
