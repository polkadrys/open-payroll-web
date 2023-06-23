import { useState, useEffect } from 'react';
import { useCall, useApi, ChainContract, useBlockHeader, useTx } from 'useink';
import { BN } from 'bn.js';
import { usePayrollContract } from '.';
import { toast } from 'react-toastify';
import {
  pickResultOk,
  planckToDecimalFormatted,
  stringNumberToBN,
  isBroadcast,
  isErrored,
  isFinalized,
  isInBlock,
  isInvalid,
  isPendingSignature,
  pickDecoded,
  bnToBalance,
} from 'useink/utils';

interface Beneficiary {
  accountId: any;
  multipliers: any;
  unclaimedPayments: any;
  lastUpdatedPeriodBlock: any;
}

export function useBeneficiary(address: string, contract: ChainContract<any> | undefined) {
  const [amountToClaim, setAmountToClaim] = useState<undefined | any>(undefined);
  const [beneficiaryMultipliers, setBeneficiaryMultipliers] = useState<undefined | any>(undefined);
  const [beneficiaryUnclaimedPayments, setBeneficiaryUnclaimedPayments] = useState<undefined | any>(undefined);
  const [lastClaim, setLastClaim] = useState<undefined | any>(undefined);
  const [beneficiary, setBeneficiary] = useState<any | undefined>(undefined);
  const [beneficiaryMultipliersToArray, setBeneficiaryMultipliersToArray] = useState<undefined | any>(undefined);
  const [finalPay, setFinalPay] = useState<undefined | any>(undefined);
  const [isBeneficiary, setIsBeneficiary] = useState<boolean>(false);
  const [beneficiaryList, setBeneficiaryList] = useState<string[] | undefined>(undefined);

  const blockHeader = useBlockHeader();
  const { rawBasePayment } = usePayrollContract(contract);

  //---------------------------------Api---------------------------------
  const api = useApi('rococo-contracts-testnet');

  //---------------------------------Get from contract---------------------------------
  const getAmountToClaim = useCall<any>(contract, 'getAmountToClaim');
  const getBeneficiary = useCall<any>(contract, 'getBeneficiary');
  const getListBeneficiaries = useCall<string[]>(contract, 'getListBeneficiaries');
  const updateBeneficiary = useTx(contract, 'updateBeneficiary');

  const getBeneficiaryMultipliersToArray = (data: any) => {
    const multipliersArray = Object.entries(data.multipliers).map(([key, value]) => ({
      multiplierId: parseInt(key),
      value: parseInt(value as string),
    }));
    setBeneficiaryMultipliersToArray(multipliersArray);
  };

  const getFinalPay = (mults: any) => {
    let sum = 0;
    for (let i = 0; i < mults.length; i++) {
      sum += mults[i].value;
    }
    const finalPay = sum * rawBasePayment;
    setFinalPay(planckToDecimalFormatted(finalPay, api?.api));
  };

  const getLastClaim = (lastClaim: any) => {
    let lastClaimFromContract = parseInt(lastClaim.replace(/,/g, ''));
    blockHeader?.blockNumber! - lastClaimFromContract > 7200 &&
      setLastClaim(`${((blockHeader?.blockNumber! - lastClaimFromContract) / 7200).toFixed(0)} days`);
    blockHeader?.blockNumber! - lastClaimFromContract < 7200 &&
      blockHeader?.blockNumber! - lastClaimFromContract > 300 &&
      setLastClaim(`${((blockHeader?.blockNumber! - lastClaimFromContract) / 300).toFixed(0)} hours`);
    blockHeader?.blockNumber! - lastClaimFromContract < 300 &&
      setLastClaim(`${((blockHeader?.blockNumber! - lastClaimFromContract) / 5).toFixed(0)} minutes`);
  };

  const handleUpdateBeneficiary = (beneficiaryAddress: string, newMultipliers: any) => {
    console.log('handleUpdateBeneficiary');
    console.log(beneficiaryAddress);
    console.log(newMultipliers);
    const newMultipliersToEntries = Object.entries(newMultipliers);
    console.log(newMultipliersToEntries);

    updateBeneficiary.signAndSend([beneficiaryAddress, newMultipliersToEntries]);
  };

  const checkIfBeneficiary = () => {
    if (address && beneficiaryList?.includes(address)) {
      setIsBeneficiary(true);
    } else {
      setIsBeneficiary(false);
    }
  }

  useEffect(() => {
    setIsBeneficiary(false);
  }, [address]);

  useEffect(() => {
    checkIfBeneficiary();
  }, [address,beneficiaryList]);
    
  useEffect(() => {
    if (contract?.contract) {
      getListBeneficiaries.send();
    }
  }, [contract?.contract]);

  useEffect(() => {
    if (getListBeneficiaries?.result) {
      let beneficiaries = pickDecoded(getListBeneficiaries.result!);
      setBeneficiaryList(beneficiaries!);
    }
  }, [getListBeneficiaries?.result]);

  useEffect(() => {
    if (contract !== undefined && isBeneficiary) {
      getAmountToClaim.send([address]);
      getBeneficiary.send([address]);
    }
  }, [contract?.contract, isBeneficiary]);

  useEffect(() => {
    if (getAmountToClaim.result?.ok) {
      let data = stringNumberToBN(pickResultOk(getAmountToClaim.result!)!);
      setAmountToClaim(planckToDecimalFormatted(data, api?.api, { decimals: 2 }));
    }
  }, [getAmountToClaim.result]);

  useEffect(() => {
    if (getBeneficiary.result?.ok) {
      let data: any = pickResultOk(getBeneficiary.result!);
      let amountToClaim = stringNumberToBN(data.unclaimedPayments);

      getBeneficiaryMultipliersToArray(data);
      setBeneficiary(data);

      setBeneficiaryMultipliers(data.multipliers);

      setAmountToClaim(planckToDecimalFormatted(amountToClaim, api?.api, { decimals: 2 }));

      getLastClaim(data.lastUpdatedPeriodBlock);
    }
  }, [getBeneficiary.result?.ok]);

  useEffect(() => {
    if (beneficiaryMultipliersToArray !== undefined) {
      getFinalPay(beneficiaryMultipliersToArray);
    }
  }, [beneficiaryMultipliersToArray]);

  useEffect(() => {
    if (isPendingSignature(updateBeneficiary)) {
      console.log({ type: updateBeneficiary.status, message: `Please sign the transaction in your wallet` });
      toast(`Please sign the transaction in your wallet`);
    }

    if (isBroadcast(updateBeneficiary)) {
      console.log({
        type: updateBeneficiary.status,
        message: 'Flip transaction has been broadcast!',
      });
      toast('Flip transaction has been broadcast!');
    }

    if (isInBlock(updateBeneficiary)) {
      console.log({
        type: updateBeneficiary.status,
        message: 'Transaction is in the block.',
      });

      toast('Transaction is in the block.');
    }

    if (isErrored(updateBeneficiary)) {
      console.log({ type: updateBeneficiary.status, message: `Error` });
      toast(`Error`);
    }
    if (isInvalid(updateBeneficiary)) {
      console.log({ type: updateBeneficiary.status, message: `IsInvalid` });
      toast(`IsInvalid`);
    }

    if (isFinalized(updateBeneficiary)) {
      console.log({ type: updateBeneficiary.status, message: `The transaction has been finalized.` });
      toast(`The transaction has been finalized.`);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateBeneficiary.status]);

  useEffect(() => {
    if (getBeneficiary.result) {
      let data: Beneficiary = pickResultOk(getBeneficiary.result!)!;
      setBeneficiaryMultipliers(data.multipliers);
      setBeneficiaryUnclaimedPayments(data.unclaimedPayments);
    }
  }, [getBeneficiary.result]);

  return {
    beneficiary,
    amountToClaim,
    lastClaim,
    beneficiaryMultipliers,
    beneficiaryUnclaimedPayments,
    beneficiaryMultipliersToArray,
    finalPay,
    handleUpdateBeneficiary,
    isBeneficiary,
  };
}
