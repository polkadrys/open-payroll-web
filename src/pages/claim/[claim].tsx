import React from 'react';
import Nav from '../../components/nav';
import Text from '../../components/generals/text';
import Button from '../../components/generals/button';
import { Archivo, Podkova } from 'next/font/google';
import WalletManager from '@/components/walletManager';
const archivo = Archivo({ subsets: ['latin'] });
const podkova = Podkova({ subsets: ['latin'] });
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AiOutlineLoading } from 'react-icons/ai';
import metadata from '../../contract/open_payroll.json';
import { useContract, useCall, useWallet } from 'useink';
import { pickDecoded } from 'useink/utils';

export default function Claim() {
  const router = useRouter();

  const { claim } = router.query;
  const contractAddress = claim?.toString();

  const [beneficiaries, setBeneficiaries] = useState<string[]>([]);
  const [isBeneficiary, setIsBeneficiary] = useState(false);
  const [loading, setLoading] = useState<'loading' | 'done' | 'error'>('loading');

  const { account } = useWallet();
  const _contract = useContract(contractAddress!, metadata);
  const getListBeneficiaries = useCall<string[]>(_contract, 'getListBeneficiaries');
  const getBeneficiary = useCall<any>(_contract, 'getBeneficiary');

  useEffect(() => {
    if (_contract?.contract) {
      getListBeneficiaries.send();
      setLoading('done');
    }
  }, [_contract?.contract]);

  useEffect(() => {
    if (getListBeneficiaries?.result) {
      let beneficiaries = pickDecoded(getListBeneficiaries.result!);
      setBeneficiaries(beneficiaries!);
    }
  }, [getListBeneficiaries?.result]);

  useEffect(() => {
    if (beneficiaries?.includes(account.address)) {
      setIsBeneficiary(true);
    }
    else{
      setIsBeneficiary(false);
    }

  }, [account,beneficiaries]);

  useEffect(() => {
    if (account && _contract?.contract) {
      getBeneficiary.send([account.address]);
    }
  }, [account, _contract?.contract]);

  useEffect(() => {
    if (getBeneficiary?.result) {
      let beneficiary = pickDecoded(getBeneficiary.result!);
      console.log(beneficiary);
    }
  }, [getBeneficiary?.result]);
    
  return (
    <main className={`flex flex-col md:flex-row ${archivo.className}`}>
      <Nav />
      <div className="w-10/12 md:w-8/12 overflow-x-scroll min-h-screen mx-auto flex flex-col gap-[20px] md:gap-[40px] mt-[50px] md:mt-[0px]">
        <div className="hidden md:flex h-[100px] justify-end">
          <WalletManager />
        </div>
        {loading === 'loading' ? (
          <div className="flex items-center w-full">
            <AiOutlineLoading className="animate-spin" />
          </div>
        ) : loading === 'done' && isBeneficiary ? (
          <div>
            <Text type="h2" text="Claiming in My contract" />
            <div className="">
              <Text type="h4" text="Yeah! You have funds to claim here!" />
              <Text
                type=""
                text="contract You can claim everything or choose when you want to claim, you can also add a name to the contract to easily identify it."
              />
            </div>
            <div className="flex">
              <div className="w-8/12 flex flex-col gap-[20px]">
                <Text type="h4" text="Contract data" />
                <form className="flex gap-[20px] items-center">
                  <label className={`text-[17px] font-normal text-black tracking-[0.15px] ${podkova.className}`}>
                    Contract name
                  </label>
                  <input
                    id="GET-name"
                    type="text"
                    name="name"
                    placeholder="Contract name"
                    className="bg-opwhite border-2 border-oppurple rounded-[5px] py-1.5 px-1.5"
                  />
                </form>
                <div className="grid grid-cols-4 gap-[20px]">
                  <div className="">
                    <Text type="h6" text="Base pay" />
                    <Text type="" text="Base pay" />
                  </div>
                  {/* .map whit multipliers */}
                  <div className="">
                    <Text type="h6" text="Multiplier 1" />
                    <Text type="" text="Multiplier 1" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Multiplier 2" />
                    <Text type="" text="Multiplier 2" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Final pay" />
                    <Text type="" text="Final pay" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Last claim" />
                    <Text type="" text="Last claim" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Last mount claimed" />
                    <Text type="" text="Last mount claimed" />
                  </div>
                  <div className="">
                    <Text type="h6" text="In contract" />
                    <Text type="" text="In contract" />
                  </div>
                </div>
              </div>
              <div className="border border-oppurple rounded-lg mx-5"></div>
              <div className="w-4/12 flex flex-col gap-[10px]">
                <Text type="h6" text="Claim" />

                <form className="flex flex-col gap-[20px]">
                  <div className="flex gap-[20px] items-center">
                    <input
                      id="GET-name"
                      type="text"
                      name="name"
                      className="bg-opwhite border-2 border-oppurple rounded-[5px] py-1.5 px-1.5"
                    />
                    <label>of XXX POL</label>
                  </div>
                  {
                    /*<Button type="active" text="claim" />*/
                    <>
                      <Button type="disabled" text="claim" />
                      <Text type="" text="You still can't claim your payment, try again in X days. + ICONO" />
                    </>
                  }
                </form>
              </div>
            </div>
          </div>
        ) : loading === 'done' && !isBeneficiary ? (
          <div>You are not a beneficiary</div> //TODO: add component to show this
        ) : null}
      </div>
    </main>
  );

  return (
    <main className={`flex flex-col md:flex-row ${archivo.className}`}>
      <Nav />
      <div className="w-10/12 md:w-8/12 overflow-x-scroll min-h-screen mx-auto flex flex-col gap-[20px] md:gap-[40px] mt-[50px] md:mt-[0px]">
        <div className="hidden md:flex h-[100px] justify-end">
          <WalletManager />
        </div>
        {loading === 'loading' ? (
          <div className="flex items-center w-full">
            <AiOutlineLoading className="animate-spin" />
          </div>
        ) : (
          <div>
            <Text type="h2" text="Claiming in My contract" />
            <div className="">
              <Text type="h4" text="Yeah! You have funds to claim here!" />
              <Text
                type=""
                text="contract You can claim everything or choose when you want to claim, you can also add a name to the contract to easily identify it."
              />
            </div>
            <div className="flex">
              <div className="w-8/12 flex flex-col gap-[20px]">
                <Text type="h4" text="Contract data" />
                <form className="flex gap-[20px] items-center">
                  <label className={`text-[17px] font-normal text-black tracking-[0.15px] ${podkova.className}`}>
                    Contract name
                  </label>
                  <input
                    id="GET-name"
                    type="text"
                    name="name"
                    placeholder="Contract name"
                    className="bg-opwhite border-2 border-oppurple rounded-[5px] py-1.5 px-1.5"
                  />
                </form>
                <div className="grid grid-cols-4 gap-[20px]">
                  <div className="">
                    <Text type="h6" text="Base pay" />
                    <Text type="" text="Base pay" />
                  </div>
                  {/* .map whit multipliers */}
                  <div className="">
                    <Text type="h6" text="Multiplier 1" />
                    <Text type="" text="Multiplier 1" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Multiplier 2" />
                    <Text type="" text="Multiplier 2" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Final pay" />
                    <Text type="" text="Final pay" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Last claim" />
                    <Text type="" text="Last claim" />
                  </div>
                  <div className="">
                    <Text type="h6" text="Last mount claimed" />
                    <Text type="" text="Last mount claimed" />
                  </div>
                  <div className="">
                    <Text type="h6" text="In contract" />
                    <Text type="" text="In contract" />
                  </div>
                </div>
              </div>
              <div className="border border-oppurple rounded-lg mx-5"></div>
              <div className="w-4/12 flex flex-col gap-[10px]">
                <Text type="h6" text="Claim" />

                <form className="flex flex-col gap-[20px]">
                  <div className="flex gap-[20px] items-center">
                    <input
                      id="GET-name"
                      type="text"
                      name="name"
                      className="bg-opwhite border-2 border-oppurple rounded-[5px] py-1.5 px-1.5"
                    />
                    <label>of XXX POL</label>
                  </div>
                  {
                    /*<Button type="active" text="claim" />*/
                    <>
                      <Button type="disabled" text="claim" />
                      <Text type="" text="You still can't claim your payment, try again in X days. + ICONO" />
                    </>
                  }
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
