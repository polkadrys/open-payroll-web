import { useState, useEffect } from 'react';
import { useCall, useApi, ChainContract, useCallSubscription, useBlockHeader } from 'useink';
import { pickDecoded, planckToDecimalFormatted, stringNumberToBN } from 'useink/utils';

interface BaseMultipliers {
  Id: string;
  Name: string;
}

export function usePayrollContract(contract: ChainContract<any> | undefined) {
  const blockHeader = useBlockHeader();
  // TODO: ChainContract<ContractPromise> | undefined

  const [contractBalance, setContractBalance] = useState<undefined | string>(undefined);
  const [rawContractBalance, setRawContractBalance] = useState<undefined | number>(undefined);
  const [periodicity, setPeriodicity] = useState<undefined | number>(undefined);
  const [totalDebts, setTotalDebts] = useState<undefined | string>(undefined);
  const [nextBlockPeriod, setNextBlockPeriod] = useState<undefined | string>(undefined);
  const [contractState, setContractState] = useState<undefined | boolean>(undefined);
  const [amountBeneficiaries, setAmountBeneficiaries] = useState<undefined | number>(undefined);
  const [listBeneficiaries, setListBeneficiaries] = useState<undefined | string[]>(undefined);
  const [multipliersIdList, setMultipliersIdList] = useState<undefined | string[]>(undefined);
  const [baseMultipliers, setBaseMultipliers] = useState<undefined | BaseMultipliers[]>(undefined);
  const [basePayment, setBasePayment] = useState<undefined | any>(undefined);
  const [rawBasePayment, setRawBasePayment] = useState<undefined | any>(undefined);
  const [unclaimBeneficiaries, setUnclaimBeneficiaries] = useState<undefined | any>(undefined);

  //---------------------------------Api---------------------------------
  const api = useApi('rococo-contracts-testnet');

  //---------------------------------Get from contract---------------------------------
  const getListBeneficiaries = useCallSubscription<string[]>(contract, 'getListBeneficiaries');
  const getNextBlockPeriod = useCallSubscription<any>(contract, 'getNextBlockPeriod');
  const getContractBalance = useCallSubscription<any>(contract, 'getContractBalance');
  const getTotalDebts = useCallSubscription<any>(contract, 'getTotalDebts');
  const getPeriodicity = useCallSubscription<number>(contract, 'getPeriodicity');
  const getBasePayment = useCallSubscription<any>(contract, 'getBasePayment');
  const getMultipliersList = useCallSubscription<any>(contract, 'getMultipliersList');
  const isPaused = useCallSubscription<boolean>(contract, 'isPaused');
  const getCountOfUnclaimBeneficiaries = useCallSubscription(contract, 'getCountOfUnclaimBeneficiaries');
  const getBaseMultiplier = useCall<any>(contract, 'getBaseMultiplier');

  useEffect(() => {
    if (getCountOfUnclaimBeneficiaries.result?.ok) {
      const decodedData = pickDecoded(getCountOfUnclaimBeneficiaries.result);
      setUnclaimBeneficiaries(decodedData);
    }
  }, [getCountOfUnclaimBeneficiaries.result]);

  useEffect(() => {
    if (getContractBalance.result) {
      const data = pickDecoded(getContractBalance.result!);
      const dataToNumber = parseInt(data?.replace(/,/g, ''));
      setRawContractBalance(dataToNumber);
      let stringToBN = stringNumberToBN(data);
      setContractBalance(planckToDecimalFormatted(stringToBN, api?.api, { decimals: 2 }));
    }
  }, [getContractBalance.result]);

  useEffect(() => {
    if (getPeriodicity.result) {
      setPeriodicity(Number(pickDecoded(getPeriodicity.result!)));
    }
  }, [getPeriodicity.result]);

  useEffect(() => {
    if (getListBeneficiaries.result) {
      let data = pickDecoded(getListBeneficiaries.result!);
      setAmountBeneficiaries(data?.length);
      setListBeneficiaries(data);
    }
  }, [getListBeneficiaries.result]);

  useEffect(() => {
    if (getTotalDebts.result && api?.api) {
      let data = stringNumberToBN(pickDecoded(getTotalDebts.result!));
      // TODO: format millions
      setTotalDebts(planckToDecimalFormatted(data, api.api, { decimals: 2 }));
    }
  }, [getTotalDebts.result, api?.api]);

  useEffect(() => {
    if (getBasePayment.result && api?.api) {
      let data = stringNumberToBN(pickDecoded(getBasePayment.result!));
      setRawBasePayment(data);
      // TODO: format millions
      setBasePayment(planckToDecimalFormatted(data, api.api, { decimals: 2 }));
    }
  }, [getBasePayment.result, api?.api]);

  useEffect(() => {
    const searchBaseMultipliers = async (multipliers: any) => {
      let localBaseMultipliers = [];
      let a_async = await getBaseMultiplier.send(multipliers[0]);
      let a = pickDecoded(a_async);
      localBaseMultipliers.push(a);
      setBaseMultipliers(localBaseMultipliers);
    };

    if (getMultipliersList.result) {
      let data = pickDecoded(getMultipliersList.result!);
      setMultipliersIdList(data);
      searchBaseMultipliers(data);
    }
  }, [getMultipliersList.result]);

  useEffect(() => {
    if (getNextBlockPeriod.result && periodicity) {
      let getNextBlockPeriodValueString = pickDecoded(getNextBlockPeriod.result);
      let nextBlockPeriod = stringNumberToBN(getNextBlockPeriodValueString).words[0];

      nextBlockPeriod - blockHeader?.blockNumber! > 7200 &&
        setNextBlockPeriod(`${((nextBlockPeriod - blockHeader?.blockNumber!) / 7200).toFixed(0)} days`);
      nextBlockPeriod - blockHeader?.blockNumber! < 7200 &&
        nextBlockPeriod - blockHeader?.blockNumber! > 300 &&
        setNextBlockPeriod(`${((nextBlockPeriod - blockHeader?.blockNumber!) / 300).toFixed(0)} hours`);
      nextBlockPeriod - blockHeader?.blockNumber! < 300 &&
        setNextBlockPeriod(`${((nextBlockPeriod - blockHeader?.blockNumber!) / 5).toFixed(0)} minutes`);
    }
  }, [getNextBlockPeriod.result]);

  useEffect(() => {
    if (getMultipliersList.result?.ok) {
      let data = pickDecoded(getMultipliersList.result!);
      setMultipliersIdList(data);
    }
  }, [getMultipliersList.result?.ok]);

  useEffect(() => {
    if (isPaused.result) {
      let data = Boolean(pickDecoded(getTotalDebts.result!)).valueOf();
      setContractState(data);
    }
  }, [isPaused.result]);

  return {
    contractState,
    contractBalance,
    periodicity,
    totalDebts,
    nextBlockPeriod,
    amountBeneficiaries,
    listBeneficiaries,
    basePayment,
    rawBasePayment,
    multipliersIdList,
    baseMultipliers,
    unclaimBeneficiaries,
    rawContractBalance,
  };
}
