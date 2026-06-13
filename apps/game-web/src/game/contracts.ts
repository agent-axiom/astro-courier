export type ContractIdentity = {
  id: string;
};

export function getNextContractId(contracts: readonly ContractIdentity[], currentContractId: string): string {
  if (contracts.length < 2) {
    return currentContractId;
  }

  const currentIndex = contracts.findIndex((contract) => contract.id === currentContractId);
  if (currentIndex < 0) {
    return currentContractId;
  }

  return contracts[(currentIndex + 1) % contracts.length].id;
}
