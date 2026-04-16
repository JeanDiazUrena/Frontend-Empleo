import { ref } from 'vue';
import { accountApi } from '../../services/accountSettingsService';
import { useRouter } from 'vue-router'; // in real use, assuming router exists

export function useDangerZone() {
  const confirmDelete = ref('');
  const showDeleteModal = ref(false);
  const showDeactivateModal = ref(false);
  const isDeleting = ref(false);
  const isDeactivating = ref(false);
  const router = useRouter();

  async function deactivateAccount() {
    isDeactivating.value = true;
    try {
      await accountApi.deactivateAccount();
      showDeactivateModal.value = false;
      if (router) router.push('/login');
    } catch(err) {
      console.error(err);
    } finally {
      isDeactivating.value = false;
    }
  }

  async function deleteAccount() {
    if (confirmDelete.value !== 'ELIMINAR') return;
    isDeleting.value = true;
    try {
      await accountApi.deleteAccount();
      showDeleteModal.value = false;
      confirmDelete.value = '';
      if (router) router.push('/login');
    } catch(err) {
      console.error(err);
    } finally {
      isDeleting.value = false;
    }
  }

  return { 
    confirmDelete, showDeleteModal, showDeactivateModal, 
    isDeleting, isDeactivating, 
    deactivateAccount, deleteAccount 
  };
}
