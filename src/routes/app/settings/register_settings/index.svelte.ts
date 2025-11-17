let deleteAction: boolean = $state(false);

export function setDeleteAction(param: boolean) {
	deleteAction = param;
}

export function getDeleteAction() {
	return deleteAction;
}
